import type { Review, Feedback, Research, Cliche } from "@prisma/client";

export type { Review, Feedback, Research, Cliche };

// 관계 포함 타입
export interface ReviewWithFeedback extends Review {
  feedback: Feedback | null;
  research: Research | null;
}

export interface ReviewWithFeedbackOnly extends Review {
  feedback: Feedback | null;
}

// API 입력 타입
export interface ResearchInput {
  artistName: string;
  albumName: string;
}

export interface FeedbackInput {
  content: string;
  artistName?: string;
  albumName?: string;
  genre?: string;
  researchId?: number;
}

// AI 피드백 응답 구조
export interface FeedbackResult {
  specificityScore: number;
  musicalElementScore: number;
  clicheScore: number;
  structureScore: number;
  personalStoryScore: number;
  overallScore: number;
  specificityComment: string;
  musicalElementComment: string;
  clicheComment: string;
  structureComment: string;
  personalStoryComment: string;
  overallComment: string;
  detectedCliches: string[];
  suggestions: string[];
}

// 분석 관련 타입
export interface ScoreTrend {
  date: string;
  specificityScore: number;
  musicalElementScore: number;
  clicheScore: number;
  structureScore: number;
  personalStoryScore: number;
  overallScore: number;
}

export interface AnalysisSummary {
  totalReviews: number;
  averageScores: {
    specificity: number;
    musicalElement: number;
    cliche: number;
    structure: number;
    personalStory: number;
    overall: number;
  };
  weakestCriterion: string;
  strongestCriterion: string;
  topCliches: { expression: string; count: number }[];
  scoreTrends: ScoreTrend[];
  recentImprovement: number | null;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
