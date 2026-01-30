import * as cheerio from "cheerio";
import type { TrendingRepo } from "@/lib/types";

const GITHUB_TRENDING_URL = "https://github.com/trending";

interface ScrapedRepo {
  repo_name: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  language_color: string | null;
  stars: number;
  stars_today: number;
  forks: number;
  rank: number;
}

export async function scrapeGitHubTrending(
  language?: string
): Promise<ScrapedRepo[]> {
  const url = language
    ? `${GITHUB_TRENDING_URL}/${encodeURIComponent(language)}`
    : GITHUB_TRENDING_URL;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub Trending: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const repos: ScrapedRepo[] = [];

  $("article.Box-row").each((index, element) => {
    if (index >= 20) return false;

    const $el = $(element);

    const repoLink = $el.find("h2 a").attr("href")?.trim() || "";
    const [owner, name] = repoLink.split("/").filter(Boolean);
    const repo_name = `${owner}/${name}`;

    const description =
      $el.find("p.col-9").text().trim() || null;

    const languageEl = $el.find('[itemprop="programmingLanguage"]');
    const language = languageEl.text().trim() || null;

    const languageColorEl = $el.find(".repo-language-color");
    const languageColor =
      languageColorEl.css("background-color") ||
      languageColorEl.attr("style")?.match(/background-color:\s*([^;]+)/)?.[1] ||
      null;

    const starsText = $el
      .find('a[href$="/stargazers"]')
      .text()
      .trim()
      .replace(/,/g, "");
    const stars = parseInt(starsText, 10) || 0;

    const forksText = $el
      .find('a[href$="/forks"]')
      .text()
      .trim()
      .replace(/,/g, "");
    const forks = parseInt(forksText, 10) || 0;

    const starsTodayText = $el
      .find(".float-sm-right, .d-inline-block.float-sm-right")
      .text()
      .trim()
      .match(/(\d[\d,]*)\s*stars?\s*today/i)?.[1]
      ?.replace(/,/g, "");
    const stars_today = parseInt(starsTodayText || "0", 10) || 0;

    repos.push({
      repo_name,
      owner,
      name,
      description,
      url: `https://github.com${repoLink}`,
      language,
      language_color: languageColor,
      stars,
      stars_today,
      forks,
      rank: index + 1,
    });
  });

  return repos;
}

export function formatTrendingDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
