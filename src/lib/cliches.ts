import prisma from "./prisma";

export interface DefaultCliche {
  expression: string;
  category: string;
  alternative: string;
}

export const DEFAULT_CLICHES: DefaultCliche[] = [
  { expression: "감성적이다", category: "감정 표현", alternative: "어떤 감정인지 구체화 (예: 쓸쓸한, 따뜻한, 그리운)" },
  { expression: "몽환적이다", category: "분위기 묘사", alternative: "어떤 종류의 몽환인지 묘사 (예: 안개 낀 새벽 같은, 꿈속을 헤매는 듯한)" },
  { expression: "중독성 있다", category: "평가", alternative: "어떤 요소가 반복 재생하게 만드는지 (예: 후렴의 멜로디 라인이, 리듬 패턴이)" },
  { expression: "귀에 꽂힌다", category: "평가", alternative: "어떤 부분이 인상적인지 (예: 인트로의 기타 리프가, 보컬 화음이)" },
  { expression: "힐링된다", category: "감정 표현", alternative: "어떻게 치유되는 느낌인지 (예: 긴장이 풀리는, 마음이 정돈되는)" },
  { expression: "소름 돋는다", category: "감정 표현", alternative: "어떤 순간에서 전율이 오는지 (예: 3분 20초의 키 체인지에서, 마지막 코러스에서)" },
  { expression: "노래가 좋다", category: "평가", alternative: "어떤 측면에서 좋은지 (예: 멜로디 구성이 탄탄한, 가사와 곡의 조화가)" },
  { expression: "목소리가 좋다", category: "보컬 평가", alternative: "음색, 톤, 호흡 등 구체적 특성 (예: 허스키한 중저음이, 맑고 투명한 고음이)" },
  { expression: "가사가 와닿는다", category: "가사 평가", alternative: "어떤 가사가 어떤 상황과 연결되는지 구체적으로" },
  { expression: "잔잔하다", category: "분위기 묘사", alternative: "어떤 악기/멜로디가 잔잔함을 만드는지 (예: 어쿠스틱 기타의 아르페지오가)" },
  { expression: "분위기가 좋다", category: "분위기 묘사", alternative: "어떤 분위기인지 구체화 (예: 늦은 밤 조용한 카페 같은)" },
  { expression: "완성도가 높다", category: "평가", alternative: "어떤 면에서 완성도가 높은지 (예: 트랙 배치의 흐름이, 사운드 밸런스가)" },
  { expression: "감동적이다", category: "감정 표현", alternative: "어떤 부분에서 어떤 감동을 받았는지 구체적으로" },
  { expression: "취향 저격이다", category: "평가", alternative: "자신의 취향과 어떤 점이 맞는지 설명" },
  { expression: "갓벽하다", category: "평가", alternative: "구체적으로 어떤 요소가 뛰어난지 설명" },
  { expression: "레전드다", category: "평가", alternative: "왜 뛰어난 작품인지 근거를 제시" },
  { expression: "띵곡이다", category: "평가", alternative: "어떤 점에서 명곡이라 느끼는지 설명" },
  { expression: "인생곡이다", category: "평가", alternative: "이 곡이 자신에게 어떤 의미인지, 어떤 순간과 연결되는지" },
  { expression: "너무 좋다", category: "평가", alternative: "좋은 이유를 구체적으로 (예: 멜로디가, 가사가, 편곡이)" },
  { expression: "아련하다", category: "분위기 묘사", alternative: "어떤 종류의 아련함인지 (예: 지나간 여름의, 돌아갈 수 없는 시간의)" },
];

export async function seedCliches(): Promise<void> {
  const existing = await prisma.cliche.count();
  if (existing > 0) return;

  await prisma.cliche.createMany({
    data: DEFAULT_CLICHES.map((c) => ({
      expression: c.expression,
      category: c.category,
      alternative: c.alternative,
      isDefault: true,
      usageCount: 0,
    })),
  });
}

export async function getCliches(): Promise<{ expression: string; alternative: string | null }[]> {
  await seedCliches();
  return prisma.cliche.findMany({
    select: { expression: true, alternative: true },
    orderBy: { expression: "asc" },
  });
}
