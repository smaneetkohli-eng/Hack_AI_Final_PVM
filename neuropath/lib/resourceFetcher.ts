import { isVerifiedSource, isVerifiedChannel } from "@/config/trustedSources";

interface SearchResult {
  title: string;
  url: string;
  source_name: string;
  thumbnail_url?: string;
  duration?: string;
  type: "video" | "article" | "doc";
  is_verified: boolean;
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
        max_results: 8,
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
      maxResults: "5",
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
          thumbnails: { medium: { url: string } };
        };
      }) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        source_name: item.snippet.channelTitle,
        thumbnail_url: item.snippet.thumbnails.medium.url,
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
  const [articles, videos] = await Promise.all([
    searchTavily(`${nodeLabel} ${skillName} tutorial guide`),
    searchYouTube(`${nodeLabel} ${skillName} tutorial`),
  ]);

  const allResults = [...videos, ...articles];

  allResults.sort((a, b) => {
    if (a.is_verified && !b.is_verified) return -1;
    if (!a.is_verified && b.is_verified) return 1;
    return 0;
  });

  const videoResults = allResults.filter((r) => r.type === "video").slice(0, 3);
  const articleResults = allResults.filter((r) => r.type !== "video").slice(0, 3);

  return [...videoResults, ...articleResults];
}
