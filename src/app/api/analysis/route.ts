import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildAnalysisSummary } from "@/lib/analysis";
import type { ApiResponse, AnalysisSummary } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AnalysisSummary>>> {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "all";

    // 기간 필터 계산
    let dateFilter: Date | undefined;
    const now = new Date();
    if (period === "month") {
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (period === "quarter") {
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }

    const where = dateFilter
      ? { review: { createdAt: { gte: dateFilter } } }
      : {};

    const reviewWhere = dateFilter
      ? { createdAt: { gte: dateFilter } }
      : {};

    // 피드백 + 리뷰 일자 조회
    const feedbacksWithReview = await prisma.feedback.findMany({
      where,
      include: { review: { select: { createdAt: true } } },
      orderBy: { createdAt: "asc" },
    });

    const totalReviews = await prisma.review.count({ where: reviewWhere });

    const summary = buildAnalysisSummary(
      feedbacksWithReview,
      feedbacksWithReview,
      totalReviews
    );

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
