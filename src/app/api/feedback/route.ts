import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import gemini from "@/lib/gemini";
import { buildFeedbackSystemPrompt } from "@/lib/prompt";
import { getCliches } from "@/lib/cliches";
import type { ApiResponse, ReviewWithFeedback, FeedbackResult } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ReviewWithFeedback>>> {
  try {
    const body = await request.json();
    const { content, artistName, albumName, genre, researchId } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "리뷰 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const charCount = content.trim().length;
    if (charCount < 50 || charCount > 500) {
      return NextResponse.json(
        { success: false, error: "리뷰는 50-500자 사이로 작성해주세요." },
        { status: 400 }
      );
    }

    // 1. 상투어 목록 조회
    const cliches = await getCliches();

    // 2. 리서치 데이터 조회
    let research = null;
    if (researchId) {
      research = await prisma.research.findUnique({
        where: { id: researchId },
      });
    }

    // 3. 시스템 프롬프트 구성
    const systemPrompt = buildFeedbackSystemPrompt({
      cliches,
      research,
      artistName,
      albumName,
      genre,
    });

    // 4. Gemini API 호출
    const model = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(
      `다음 음악 리뷰를 평가해주세요:\n\n"${content}"`
    );

    const responseText = result.response.text();

    // 5. 응답 파싱
    let feedbackResult: FeedbackResult;
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      feedbackResult = JSON.parse(jsonStr.trim());
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 응답을 파싱하지 못했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 6. Review + Feedback 저장
    const review = await prisma.review.create({
      data: {
        content: content.trim(),
        charCount,
        artistName: artistName ?? null,
        albumName: albumName ?? null,
        genre: genre ?? null,
        feedback: {
          create: {
            specificityScore: feedbackResult.specificityScore,
            musicalElementScore: feedbackResult.musicalElementScore,
            clicheScore: feedbackResult.clicheScore,
            structureScore: feedbackResult.structureScore,
            personalStoryScore: feedbackResult.personalStoryScore,
            overallScore: feedbackResult.overallScore,
            specificityComment: feedbackResult.specificityComment,
            musicalElementComment: feedbackResult.musicalElementComment,
            clicheComment: feedbackResult.clicheComment,
            structureComment: feedbackResult.structureComment,
            personalStoryComment: feedbackResult.personalStoryComment,
            overallComment: feedbackResult.overallComment,
            detectedCliches: JSON.stringify(feedbackResult.detectedCliches ?? []),
            suggestions: JSON.stringify(feedbackResult.suggestions ?? []),
          },
        },
      },
      include: {
        feedback: true,
        research: true,
      },
    });

    // 리서치가 있으면 연결
    if (researchId && research) {
      await prisma.research.update({
        where: { id: researchId },
        data: { reviewId: review.id },
      });
    }

    // 7. 감지된 상투어 usageCount 업데이트
    if (feedbackResult.detectedCliches && feedbackResult.detectedCliches.length > 0) {
      for (const cliche of feedbackResult.detectedCliches) {
        await prisma.cliche.updateMany({
          where: { expression: cliche },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // 다시 조회하여 research 포함
    const fullReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: { feedback: true, research: true },
    });

    return NextResponse.json({
      success: true,
      data: fullReview as ReviewWithFeedback,
    });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { success: false, error: "피드백 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
