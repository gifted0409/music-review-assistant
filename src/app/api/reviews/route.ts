import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, ReviewWithFeedback, PaginatedResponse } from "@/types";

// GET: 리뷰 목록 (페이지네이션, 검색)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<ReviewWithFeedback>>>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
    const search = searchParams.get("search") ?? "";

    const where = search
      ? {
          OR: [
            { content: { contains: search } },
            { artistName: { contains: search } },
            { albumName: { contains: search } },
          ],
        }
      : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { feedback: true, research: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: reviews as ReviewWithFeedback[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { success: false, error: "리뷰 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
