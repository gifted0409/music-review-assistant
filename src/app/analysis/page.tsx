"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalysisSummary } from "@/types";

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analysis?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">불러오는 중...</div>
    );
  }

  if (!analysis || analysis.totalReviews === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          패턴 분석
        </h1>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            분석할 리뷰가 아직 없습니다. 리뷰를 작성해주세요.
          </p>
        </div>
      </div>
    );
  }

  const scoreLabels: Record<string, string> = {
    specificity: "감상 구체성",
    musicalElement: "음악적 요소",
    cliche: "상투어",
    structure: "글 구조",
    personalStory: "개인 스토리",
    overall: "종합",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          패턴 분석
        </h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
        >
          <option value="all">전체</option>
          <option value="month">최근 1개월</option>
          <option value="quarter">최근 3개월</option>
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="총 리뷰 수"
          value={analysis.totalReviews.toString()}
        />
        <SummaryCard
          label="종합 평균"
          value={`${analysis.averageScores.overall}/5`}
        />
        <SummaryCard label="가장 강한 항목" value={analysis.strongestCriterion} />
        <SummaryCard label="가장 약한 항목" value={analysis.weakestCriterion} />
      </div>

      {/* 기준별 평균 점수 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          기준별 평균 점수
        </h2>
        <div className="space-y-3">
          {Object.entries(analysis.averageScores).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 w-28 shrink-0">
                {scoreLabels[key] ?? key}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                <div
                  className="bg-violet-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(value / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                {value}/5
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 성장 지표 */}
      {analysis.recentImprovement !== null && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            성장 지표
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`text-3xl font-bold ${
                analysis.recentImprovement > 0
                  ? "text-green-500"
                  : analysis.recentImprovement < 0
                    ? "text-red-500"
                    : "text-gray-500"
              }`}
            >
              {analysis.recentImprovement > 0 ? "+" : ""}
              {analysis.recentImprovement}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              최근 절반 vs 이전 절반 종합점수 변화
            </span>
          </div>
        </section>
      )}

      {/* 상투어 TOP 5 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          자주 감지된 상투어 TOP 5
        </h2>
        {analysis.topCliches.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            아직 감지된 상투어가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {analysis.topCliches.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                    #{i + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    &quot;{c.expression}&quot;
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {c.count}회
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 점수 추이 */}
      {analysis.scoreTrends.length > 1 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            점수 추이
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  <th className="pb-2 pr-4">날짜</th>
                  <th className="pb-2 pr-4">구체성</th>
                  <th className="pb-2 pr-4">음악요소</th>
                  <th className="pb-2 pr-4">상투어</th>
                  <th className="pb-2 pr-4">구조</th>
                  <th className="pb-2 pr-4">스토리</th>
                  <th className="pb-2">종합</th>
                </tr>
              </thead>
              <tbody>
                {analysis.scoreTrends.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                      {t.date}
                    </td>
                    <td className="py-2 pr-4">{t.specificityScore}</td>
                    <td className="py-2 pr-4">{t.musicalElementScore}</td>
                    <td className="py-2 pr-4">{t.clicheScore}</td>
                    <td className="py-2 pr-4">{t.structureScore}</td>
                    <td className="py-2 pr-4">{t.personalStoryScore}</td>
                    <td className="py-2 font-medium text-violet-600 dark:text-violet-400">
                      {t.overallScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
