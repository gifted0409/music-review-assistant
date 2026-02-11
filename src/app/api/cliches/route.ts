import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { seedCliches } from "@/lib/cliches";
import type { ApiResponse, Cliche } from "@/types";

// GET: 상투어 목록 조회
export async function GET(): Promise<NextResponse<ApiResponse<Cliche[]>>> {
  try {
    await seedCliches();
    const cliches = await prisma.cliche.findMany({
      orderBy: [{ usageCount: "desc" }, { expression: "asc" }],
    });

    return NextResponse.json({ success: true, data: cliches });
  } catch (error) {
    console.error("Failed to fetch cliches:", error);
    return NextResponse.json(
      { success: false, error: "상투어 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 상투어 추가
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Cliche>>> {
  try {
    const body = await request.json();
    const { expression, category, alternative } = body;

    if (!expression || expression.trim() === "") {
      return NextResponse.json(
        { success: false, error: "상투어 표현을 입력해주세요." },
        { status: 400 }
      );
    }

    const cliche = await prisma.cliche.create({
      data: {
        expression: expression.trim(),
        category: category?.trim() || null,
        alternative: alternative?.trim() || null,
        isDefault: false,
      },
    });

    return NextResponse.json({ success: true, data: cliche });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { success: false, error: "이미 등록된 상투어입니다." },
        { status: 400 }
      );
    }
    console.error("Failed to create cliche:", error);
    return NextResponse.json(
      { success: false, error: "상투어 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 상투어 삭제
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") ?? "");

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    await prisma.cliche.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete cliche:", error);
    return NextResponse.json(
      { success: false, error: "상투어 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
