export const TRUSTED_CHANNELS = [
  "3Blue1Brown",
  "MIT OpenCourseWare",
  "freeCodeCamp",
  "Fireship",
  "Traversy Media",
  "The Coding Train",
  "Academind",
  "CS50",
  "Stanford Online",
  "Khan Academy",
  "Corey Schafer",
  "Tech With Tim",
  "Sentdex",
  "StatQuest with Josh Starmer",
  "Two Minute Papers",
  "Andrej Karpathy",
  "Lex Fridman",
  "ArjanCodes",
];

export const TRUSTED_DOMAINS = [
  "developer.mozilla.org",
  "docs.python.org",
  "pytorch.org",
  "tensorflow.org",
  "react.dev",
  "nextjs.org",
  "web.dev",
  "css-tricks.com",
  "medium.com/towards-data-science",
  "arxiv.org",
  "papers.nips.cc",
  "distill.pub",
  "the-algorithm.net",
];

export function isVerifiedSource(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return TRUSTED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function isVerifiedChannel(channelName: string): boolean {
  return TRUSTED_CHANNELS.some(
    (c) => c.toLowerCase() === channelName.toLowerCase()
  );
}
