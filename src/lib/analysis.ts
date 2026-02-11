import type { Feedback } from "@prisma/client";
import type { AnalysisSummary, ScoreTrend } from "@/types";

const CRITERION_NAMES: Record<string, string> = {
  specificity: "감상의 구체성",
  musicalElement: "음악적 요소 언급",
  cliche: "상투어 사용",
  structure: "글의 구조/흐름",
  personalStory: "개인 스토리",
};

export function calculateAverageScores(feedbacks: Feedback[]) {
  if (feedbacks.length === 0) {
    return {
      specificity: 0,
      musicalElement: 0,
      cliche: 0,
      structure: 0,
      personalStory: 0,
      overall: 0,
    };
  }

  const sum = feedbacks.reduce(
    (acc, f) => ({
      specificity: acc.specificity + f.specificityScore,
      musicalElement: acc.musicalElement + f.musicalElementScore,
      cliche: acc.cliche + f.clicheScore,
      structure: acc.structure + f.structureScore,
      personalStory: acc.personalStory + f.personalStoryScore,
      overall: acc.overall + f.overallScore,
    }),
    { specificity: 0, musicalElement: 0, cliche: 0, structure: 0, personalStory: 0, overall: 0 }
  );

  const count = feedbacks.length;
  return {
    specificity: Math.round((sum.specificity / count) * 10) / 10,
    musicalElement: Math.round((sum.musicalElement / count) * 10) / 10,
    cliche: Math.round((sum.cliche / count) * 10) / 10,
    structure: Math.round((sum.structure / count) * 10) / 10,
    personalStory: Math.round((sum.personalStory / count) * 10) / 10,
    overall: Math.round((sum.overall / count) * 10) / 10,
  };
}

export function findWeakestAndStrongest(averageScores: ReturnType<typeof calculateAverageScores>) {
  const entries = Object.entries(averageScores).filter(([key]) => key !== "overall");
  if (entries.every(([, v]) => v === 0)) {
    return { weakest: "-", strongest: "-" };
  }

  const sorted = entries.sort((a, b) => a[1] - b[1]);
  return {
    weakest: CRITERION_NAMES[sorted[0][0]] ?? sorted[0][0],
    strongest: CRITERION_NAMES[sorted[sorted.length - 1][0]] ?? sorted[sorted.length - 1][0],
  };
}

export function calculateScoreTrends(
  feedbacks: (Feedback & { review: { createdAt: Date } })[]
): ScoreTrend[] {
  return feedbacks.map((f) => ({
    date: f.review.createdAt.toISOString().split("T")[0],
    specificityScore: f.specificityScore,
    musicalElementScore: f.musicalElementScore,
    clicheScore: f.clicheScore,
    structureScore: f.structureScore,
    personalStoryScore: f.personalStoryScore,
    overallScore: f.overallScore,
  }));
}

export function calculateRecentImprovement(feedbacks: Feedback[]): number | null {
  if (feedbacks.length < 4) return null;

  const half = Math.floor(feedbacks.length / 2);
  const olderHalf = feedbacks.slice(0, half);
  const newerHalf = feedbacks.slice(half);

  const olderAvg =
    olderHalf.reduce((sum, f) => sum + f.overallScore, 0) / olderHalf.length;
  const newerAvg =
    newerHalf.reduce((sum, f) => sum + f.overallScore, 0) / newerHalf.length;

  return Math.round((newerAvg - olderAvg) * 10) / 10;
}

export function aggregateDetectedCliches(
  feedbacks: Feedback[]
): { expression: string; count: number }[] {
  const clicheMap = new Map<string, number>();

  for (const f of feedbacks) {
    try {
      const detected: string[] = JSON.parse(f.detectedCliches);
      for (const c of detected) {
        clicheMap.set(c, (clicheMap.get(c) ?? 0) + 1);
      }
    } catch {
      // skip malformed JSON
    }
  }

  return Array.from(clicheMap.entries())
    .map(([expression, count]) => ({ expression, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function buildAnalysisSummary(
  feedbacks: Feedback[],
  feedbacksWithReview: (Feedback & { review: { createdAt: Date } })[],
  totalReviews: number
): AnalysisSummary {
  const averageScores = calculateAverageScores(feedbacks);
  const { weakest, strongest } = findWeakestAndStrongest(averageScores);

  return {
    totalReviews,
    averageScores,
    weakestCriterion: weakest,
    strongestCriterion: strongest,
    topCliches: aggregateDetectedCliches(feedbacks),
    scoreTrends: calculateScoreTrends(feedbacksWithReview),
    recentImprovement: calculateRecentImprovement(feedbacks),
  };
}
