/**
 * Web search. Uses Brave Search if BRAVE_SEARCH_API_KEY is set (best results),
 * otherwise falls back to DuckDuckGo's keyless Instant Answer API. Server-only.
 */
export interface SearchResult {
  title: string;
  snippet: string;
  source: string;
}

export async function webSearch(
  query: string,
): Promise<{ query: string; results: SearchResult[]; note?: string }> {
  const q = query.trim();
  if (!q) return { query, results: [] };

  // Preferred: Brave Search (generous free tier).
  const brave = process.env.BRAVE_SEARCH_API_KEY;
  if (brave) {
    try {
      const r = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=4`,
        { headers: { "X-Subscription-Token": brave, Accept: "application/json" } },
      );
      const d = await r.json();
      const results: SearchResult[] = (d?.web?.results ?? []).slice(0, 4).map(
        (x: { title?: string; description?: string; url?: string }) => ({
          title: x.title ?? q,
          snippet: x.description ?? "",
          source: x.url ?? "",
        }),
      );
      if (results.length) return { query: q, results };
    } catch {
      /* fall through to keyless */
    }
  }

  // Keyless fallback: DuckDuckGo Instant Answer (limited but free).
  try {
    const r = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
    );
    const d = await r.json();
    const results: SearchResult[] = [];
    if (d?.AbstractText) {
      results.push({
        title: d.Heading || q,
        snippet: d.AbstractText,
        source: d.AbstractURL || "duckduckgo.com",
      });
    }
    for (const t of d?.RelatedTopics ?? []) {
      if (results.length >= 4) break;
      if (t?.Text && t?.FirstURL) {
        results.push({ title: String(t.Text).split(" - ")[0], snippet: t.Text, source: t.FirstURL });
      }
    }
    if (results.length) return { query: q, results };
    return {
      query: q,
      results: [],
      note: "No instant answer found. Set BRAVE_SEARCH_API_KEY for full web results.",
    };
  } catch {
    return { query: q, results: [], note: "Web search is unavailable right now." };
  }
}
