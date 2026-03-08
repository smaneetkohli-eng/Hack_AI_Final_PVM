import { isVerifiedSource, isVerifiedChannel } from "@/config/trustedSources";

interface SearchResult {
  title: string;
  url: string;
  source_name: string;
  thumbnail_url?: string;
  duration?: string;
  description?: string;
  type: "video" | "article" | "doc";
  is_verified: boolean;
}

/** Truncate raw text to a brief description (max ~100 chars) */
function toBriefDescription(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/\[\.\.\.\]/g, " ")
    .replace(/\[.*?\]/g, "")
    .replace(/<chunk \d+>/gi, "")
    .trim();
  if (cleaned.length < 15) return undefined;
  return cleaned.length <= 100 ? cleaned : cleaned.slice(0, 97).trim() + "...";
}

/** Normalize URL for deduplication (strip trailing slashes, fragments, some query params) */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const v = u.searchParams.get("v") || u.pathname.split("/").pop();
      return v ? `https://www.youtube.com/watch?v=${v}` : url;
    }
    return u.origin + u.pathname.replace(/\/$/, "") || url;
  } catch {
    return url;
  }
}

/** Deduplicate by normalized URL to avoid redundant results */
function deduplicateByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = normalizeUrl(item.url);
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

export async function searchTavily(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 12,
        include_domains: [],
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.results || []).map(
      (r: { title: string; url: string; content?: string }) => {
        const isYouTube = r.url.includes("youtube.com") || r.url.includes("youtu.be");
        const hostname = new URL(r.url).hostname.replace("www.", "");
        return {
          title: r.title,
          url: r.url,
          source_name: hostname,
          description: toBriefDescription(r.content),
          type: isYouTube ? "video" : "article",
          is_verified: isVerifiedSource(r.url),
        };
      }
    );
  } catch {
    return [];
  }
}

export async function searchYouTube(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "8",
      relevanceLanguage: "en",
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );
    if (!response.ok) return [];
    const data = await response.json();

    return (data.items || []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          description?: string;
          thumbnails: { medium: { url: string } };
        };
      }) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        source_name: item.snippet.channelTitle,
        thumbnail_url: item.snippet.thumbnails.medium.url,
        description: toBriefDescription(item.snippet.description),
        type: "video" as const,
        is_verified: isVerifiedChannel(item.snippet.channelTitle),
      })
    );
  } catch {
    return [];
  }
}

export async function fetchResourcesForNode(
  nodeLabel: string,
  skillName: string
): Promise<SearchResult[]> {
  const [tavilyResults, youtubeVideos] = await Promise.all([
    searchTavily(`${nodeLabel} ${skillName} tutorial guide`),
    searchYouTube(`${nodeLabel} ${skillName} tutorial`),
  ]);

  // Tavily can return YouTube links; merge and deduplicate by URL
  const allVideos = deduplicateByUrl([...youtubeVideos, ...tavilyResults.filter((r) => r.type === "video")]);
  const allArticles = deduplicateByUrl(tavilyResults.filter((r) => r.type !== "video"));

  const sortByQuality = (a: SearchResult, b: SearchResult) => {
    if (a.is_verified && !b.is_verified) return -1;
    if (!a.is_verified && b.is_verified) return 1;
    return 0;
  };

  allVideos.sort(sortByQuality);
  allArticles.sort(sortByQuality);

  // Balance: 4–5 per category for variety without overwhelming
  const videoResults = allVideos.slice(0, 5);
  const articleResults = allArticles.slice(0, 5);

  return [...videoResults, ...articleResults];
}
