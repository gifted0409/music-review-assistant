import type { MBStructuredData } from "./musicbrainz";

export interface PageContent {
  url: string;
  content: string;
}

/**
 * Wikipedia HTML에서 <p> 태그 본문만 추출한다.
 * 네비게이션, 푸터, 사이드바 노이즈를 제거하고 본문만 깔끔하게 확보.
 */
export function extractWikipediaContent(html: string): string {
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(html)) !== null) {
    let text = match[1];
    text = text.replace(/<[^>]+>/g, "");
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
    text = text.replace(/\[\d+\]/g, "");
    text = text.replace(/\s+/g, " ").trim();
    if (text.length > 30) {
      paragraphs.push(text);
    }
  }
  return paragraphs.join("\n\n").slice(0, 5000);
}

/**
 * Wikipedia 페이지를 가져온다. 영문/한국어 Wikipedia 모두 지원.
 */
export async function fetchWikipediaContent(
  pageName: string,
  lang: "en" | "ko" = "en"
): Promise<PageContent | null> {
  const domain = lang === "ko" ? "ko.wikipedia.org" : "en.wikipedia.org";
  const url = `https://${domain}/wiki/${encodeURIComponent(pageName.replace(/ /g, "_"))}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MusicReviewAssistant/1.0 (educational project)",
      },
    });

    clearTimeout(timeout);
    if (!response.ok) return null;

    const html = await response.text();
    const content = extractWikipediaContent(html);

    if (content.length < 100) return null;
    return { url, content };
  } catch {
    return null;
  }
}

/**
 * 일반 웹 페이지에서 텍스트를 추출한다.
 * script/style 제거 후 <p> 태그 내용을 우선 추출, 부족하면 전체 텍스트 사용.
 */
export function extractPageContent(html: string): string {
  // script, style 제거
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // <p> 태그 본문 우선 추출
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(cleaned)) !== null) {
    let text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 20) paragraphs.push(text);
  }

  if (paragraphs.join(" ").length > 200) {
    return paragraphs.join("\n\n").slice(0, 4000);
  }

  // <p> 부족 시 전체 텍스트
  const text = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 4000);
}

/**
 * 리뷰 사이트(Metacritic, AOTY, RYM) 페이지를 fetch한다.
 */
export async function fetchReviewSite(url: string): Promise<PageContent | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);
    if (!response.ok) return null;

    const html = await response.text();
    const content = extractPageContent(html);

    if (content.length < 50) return null;
    return { url, content };
  } catch {
    return null;
  }
}

/**
 * 리뷰 사이트 URL 목록을 생성한다.
 */
export function buildReviewSiteUrls(
  artistName: string,
  albumName: string
): { site: string; url: string }[] {
  const q = encodeURIComponent(`${artistName} ${albumName}`);
  return [
    {
      site: "Metacritic",
      url: `https://www.metacritic.com/search/${q}/?page=1&category=2`,
    },
    {
      site: "Album of the Year",
      url: `https://www.albumoftheyear.org/search/albums/?q=${q}`,
    },
    {
      site: "Rate Your Music",
      url: `https://rateyourmusic.com/search?searchterm=${q}&searchtype=l`,
    },
  ];
}

/**
 * MusicBrainz 구조화 데이터를 사람이 읽을 수 있는 텍스트로 포맷한다.
 */
export function formatMusicBrainzData(data: MBStructuredData): string {
  const lines: string[] = [];

  if (data.artist) {
    lines.push("## 아티스트 정보 (MusicBrainz)");
    lines.push(`- 이름: ${data.artist.name}`);
    if (data.artist.type) lines.push(`- 유형: ${data.artist.type}`);
    if (data.artist.country) lines.push(`- 국가: ${data.artist.country}`);
    if (data.artist.activeFrom)
      lines.push(`- 활동 시작: ${data.artist.activeFrom}`);
    if (data.artist.tags.length > 0)
      lines.push(`- 태그: ${data.artist.tags.join(", ")}`);
  }

  if (data.release) {
    lines.push("\n## 앨범 정보 (MusicBrainz)");
    lines.push(`- 제목: ${data.release.title}`);
    if (data.release.date) lines.push(`- 발매일: ${data.release.date}`);
    if (data.release.type) lines.push(`- 유형: ${data.release.type}`);
    if (data.release.label) lines.push(`- 레이블: ${data.release.label}`);
    lines.push(`- 트랙 수: ${data.release.trackCount}`);
    if (data.release.tracks.length > 0) {
      lines.push("- 트랙리스트:");
      data.release.tracks.forEach((t, i) => {
        lines.push(`  ${i + 1}. ${t}`);
      });
    }
  }

  return lines.join("\n");
}

/**
 * 리서치 컨텍스트를 조합한다.
 * MusicBrainz 구조화 데이터 + Wikipedia 텍스트를 결합.
 */
export function buildResearchContext(
  artistName: string,
  albumName: string,
  mbData: MBStructuredData,
  wikiContents: PageContent[],
  reviewSiteContents: { site: string; content: PageContent }[]
): string {
  let context = `# 리서치 대상\n아티스트: ${artistName}\n앨범: ${albumName}\n\n`;

  // MusicBrainz 구조화 데이터 (최고 우선순위 - 사실 기반)
  const mbText = formatMusicBrainzData(mbData);
  if (mbText.length > 0) {
    context += `# 확인된 사실 정보 (MusicBrainz 데이터베이스)\n${mbText}\n\n`;
  }

  // 리뷰 사이트 데이터 (Metacritic, AOTY, RYM)
  if (reviewSiteContents.length > 0) {
    context += "# 음악 리뷰 사이트 정보\n";
    for (const { site, content } of reviewSiteContents) {
      context += `## ${site} (${content.url})\n${content.content.slice(0, 2000)}\n\n`;
    }
  }

  // Wikipedia 보조 자료
  if (wikiContents.length > 0) {
    context += "# 참고 자료 (Wikipedia)\n";
    for (const page of wikiContents) {
      context += `## 출처: ${page.url}\n${page.content.slice(0, 3000)}\n\n`;
    }
  }

  // 수집 결과가 빈약한 경우
  const hasSubstantialData =
    mbText.length > 100 ||
    wikiContents.some((w) => w.content.length > 200) ||
    reviewSiteContents.length > 0;
  if (!hasSubstantialData) {
    context +=
      "# 데이터 수집 현황\n외부 소스에서 충분한 정보를 수집하지 못했습니다. 당신이 학습 과정에서 알고 있는 이 아티스트/앨범에 대한 지식을 활용하여 요약해주세요. 단, 확실하지 않은 정보는 반드시 '확인 필요'라고 표기해주세요.\n\n";
  }

  return context;
}
