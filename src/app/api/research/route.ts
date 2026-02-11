import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import gemini from "@/lib/gemini";
import { buildResearchSystemPrompt } from "@/lib/prompt";
import { fetchMusicBrainzData, resolveArtistName } from "@/lib/musicbrainz";
import {
  fetchWikipediaContent,
  fetchReviewSite,
  buildReviewSiteUrls,
  buildResearchContext,
  type PageContent,
} from "@/lib/research";
import type { ApiResponse, Research } from "@/types";

interface ResearchAIResponse {
  genre?: string;
  artistBio?: string;
  albumSummary?: string;
  userOpinions?: string;
  keyThemes?: string;
  confidence?: "high" | "medium" | "low";
}

/**
 * AI 응답 텍스트에서 JSON을 안전하게 추출한다.
 * 3단계: 순수 JSON → 코드블록 → brace 추출
 */
function parseAIResponse(responseText: string): ResearchAIResponse | null {
  // 1차: 순수 JSON
  try {
    return JSON.parse(responseText.trim());
  } catch {
    /* 계속 */
  }

  // 2차: ```json ... ``` 블록
  const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      /* 계속 */
    }
  }

  // 3차: 첫 번째 { ... } 블록
  const braceMatch = responseText.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      /* 실패 */
    }
  }

  return null;
}

/**
 * 파싱된 결과의 각 필드를 검증하고 정제한다.
 */
function validateResearchResponse(
  parsed: ResearchAIResponse
): ResearchAIResponse {
  const maxFieldLength = 2000;

  const sanitize = (val: unknown): string | undefined => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxFieldLength) : undefined;
  };

  return {
    genre: sanitize(parsed.genre),
    artistBio: sanitize(parsed.artistBio),
    albumSummary: sanitize(parsed.albumSummary),
    userOpinions: sanitize(parsed.userOpinions),
    keyThemes: sanitize(parsed.keyThemes),
    confidence: ["high", "medium", "low"].includes(parsed.confidence ?? "")
      ? parsed.confidence
      : "low",
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Research>>> {
  try {
    const body = await request.json();
    const { artistName, albumName } = body;

    if (!artistName || !albumName) {
      return NextResponse.json(
        { success: false, error: "아티스트명과 앨범명을 입력해주세요." },
        { status: 400 }
      );
    }

    // === 0단계: 한국어 아티스트명 → 영문명 변환 ===
    const { resolved: resolvedArtist } = await resolveArtistName(artistName);

    // MusicBrainz rate limit: resolveArtistName 호출 후 대기
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // === 1단계: 데이터 수집 (병렬) ===

    // 리뷰 사이트 URL 생성 (영문명 사용)
    const reviewSiteUrls = buildReviewSiteUrls(resolvedArtist, albumName);

    // MusicBrainz + Wikipedia + 리뷰 사이트를 동시에 요청
    const [mbData, wikiAlbumEn, wikiArtistEn, wikiAlbumKo, ...reviewResults] =
      await Promise.all([
        fetchMusicBrainzData(resolvedArtist, albumName),
        fetchWikipediaContent(`${albumName} (album)`, "en"),
        fetchWikipediaContent(resolvedArtist, "en"),
        fetchWikipediaContent(albumName, "ko"),
        ...reviewSiteUrls.map((rs) => fetchReviewSite(rs.url)),
      ]);

    const wikiContents: PageContent[] = [
      wikiAlbumEn,
      wikiArtistEn,
      wikiAlbumKo,
    ].filter((w): w is PageContent => w !== null);

    // 리뷰 사이트 결과 매핑
    const reviewSiteContents: { site: string; content: PageContent }[] = [];
    reviewSiteUrls.forEach((rs, i) => {
      const result = reviewResults[i];
      if (result) {
        reviewSiteContents.push({ site: rs.site, content: result });
      }
    });

    // 소스 목록 구성
    const sources: string[] = [];
    if (mbData.artist || mbData.release) sources.push("musicbrainz.org");
    for (const w of wikiContents) sources.push(w.url);
    for (const rs of reviewSiteContents) sources.push(rs.content.url);

    // === 2단계: 리서치 컨텍스트 조합 ===
    const researchContext = buildResearchContext(
      artistName,
      albumName,
      mbData,
      wikiContents,
      reviewSiteContents
    );

    // === 3단계: Gemini AI 호출 ===
    const model = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: buildResearchSystemPrompt(),
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(
      `다음 수집된 정보를 바탕으로 앨범 리서치 요약을 JSON으로 작성해주세요.\n\n${researchContext}`
    );

    const responseText = result.response.text();

    // === 4단계: 응답 파싱 + 검증 ===
    const parsed = parseAIResponse(responseText);
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error: "AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    const validated = validateResearchResponse(parsed);

    if (!validated.genre && !validated.artistBio && !validated.albumSummary) {
      return NextResponse.json(
        {
          success: false,
          error: "유효한 리서치 결과를 생성하지 못했습니다. 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    // === 5단계: DB 저장 ===
    const research = await prisma.research.create({
      data: {
        artistName,
        albumName,
        genre: validated.genre ?? null,
        artistBio: validated.artistBio ?? null,
        albumSummary: validated.albumSummary ?? null,
        userOpinions: validated.userOpinions ?? null,
        keyThemes: validated.keyThemes ?? null,
        sources: JSON.stringify(sources),
        confidence: validated.confidence ?? "low",
      },
    });

    return NextResponse.json({ success: true, data: research });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { success: false, error: "리서치 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
