"use client";

import { useState } from "react";
import type { Research, ReviewWithFeedback } from "@/types";

export default function Home() {
  // 리서치 상태
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [research, setResearch] = useState<Research | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");

  // 리뷰 상태
  const [reviewContent, setReviewContent] = useState("");
  const [genre, setGenre] = useState("");
  const [feedbackResult, setFeedbackResult] = useState<ReviewWithFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const charCount = reviewContent.length;

  async function handleResearch() {
    if (!artistName.trim() || !albumName.trim()) {
      setResearchError("아티스트명과 앨범명을 모두 입력해주세요.");
      return;
    }
    setResearchLoading(true);
    setResearchError("");
    setResearch(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName: artistName.trim(), albumName: albumName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResearch(data.data);
      } else {
        setResearchError(data.error ?? "리서치에 실패했습니다.");
      }
    } catch {
      setResearchError("네트워크 오류가 발생했습니다.");
    } finally {
      setResearchLoading(false);
    }
  }

  async function handleFeedback() {
    if (!reviewContent.trim()) {
      setFeedbackError("리뷰 내용을 입력해주세요.");
      return;
    }
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackResult(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reviewContent.trim(),
          artistName: artistName.trim() || undefined,
          albumName: albumName.trim() || undefined,
          genre: genre.trim() || undefined,
          researchId: research?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackResult(data.data);
      } else {
        setFeedbackError(data.error ?? "피드백 생성에 실패했습니다.");
      }
    } catch {
      setFeedbackError("네트워크 오류가 발생했습니다.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  function renderScoreDots(score: number) {
    return (
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`inline-block w-3 h-3 rounded-full ${
              i <= score
                ? "bg-violet-500"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </span>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        음악 리뷰 피드백 도우미
      </h1>

      {/* 앨범 리서치 섹션 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          앨범 리서치
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="아티스트명"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
          <input
            type="text"
            placeholder="앨범명"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleResearch}
            disabled={researchLoading}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {researchLoading ? "리서치 중..." : "리서치 시작"}
          </button>
        </div>

        {researchError && (
          <p className="mt-3 text-red-500 text-sm">{researchError}</p>
        )}

        {research && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                리서치 결과
              </h3>
              {research.confidence && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    research.confidence === "high"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : research.confidence === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                        : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300"
                  }`}
                >
                  {research.confidence === "high"
                    ? "신뢰도 높음"
                    : research.confidence === "medium"
                      ? "신뢰도 보통"
                      : "신뢰도 낮음"}
                </span>
              )}
            </div>
            {research.genre && (
              <div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  장르:
                </span>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {research.genre}
                </span>
              </div>
            )}
            {research.artistBio && (
              <div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  아티스트:
                </span>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {research.artistBio}
                </span>
              </div>
            )}
            {research.albumSummary && (
              <div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  앨범 정보:
                </span>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {research.albumSummary}
                </span>
              </div>
            )}
            {research.userOpinions && (
              <div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  유저 평가:
                </span>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {research.userOpinions}
                </span>
              </div>
            )}
            {research.keyThemes && (
              <div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  핵심 키워드:
                </span>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {research.keyThemes}
                </span>
              </div>
            )}
            {(() => {
              try {
                const sources: string[] = JSON.parse(research.sources);
                if (sources.length === 0) return null;
                return (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      참고 소스:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sources.map((source, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs rounded"
                        >
                          {source.includes("musicbrainz")
                            ? "MusicBrainz"
                            : source.includes("ko.wikipedia")
                              ? "Wikipedia (한국어)"
                              : source.includes("en.wikipedia")
                                ? "Wikipedia (영어)"
                                : source.includes("metacritic")
                                  ? "Metacritic"
                                  : source.includes("albumoftheyear")
                                    ? "Album of the Year"
                                    : source.includes("rateyourmusic")
                                      ? "Rate Your Music"
                                      : source}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
        )}
      </section>

      {/* 리뷰 작성 섹션 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          리뷰 작성
        </h2>

        <div className="mb-3">
          <input
            type="text"
            placeholder="장르 (선택)"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div className="relative">
          <textarea
            placeholder="앨범 감상 리뷰를 작성해주세요... (200-300자 권장)"
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
          />
          <div className="absolute bottom-3 right-3 text-sm">
            <span
              className={
                charCount >= 200 && charCount <= 300
                  ? "text-green-500"
                  : charCount > 300
                    ? "text-red-500"
                    : "text-gray-400"
              }
            >
              {charCount}/300자{" "}
              {charCount >= 200 && charCount <= 300 ? "✅" : ""}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleFeedback}
            disabled={feedbackLoading || charCount < 50}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {feedbackLoading ? "분석 중..." : "피드백 받기"}
          </button>
        </div>

        {feedbackError && (
          <p className="mt-3 text-red-500 text-sm">{feedbackError}</p>
        )}
      </section>

      {/* AI 피드백 결과 */}
      {feedbackResult?.feedback && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI 피드백 결과
          </h2>

          <div className="space-y-4">
            {/* 점수 표시 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreRow
                label="감상 구체성"
                score={feedbackResult.feedback.specificityScore}
                comment={feedbackResult.feedback.specificityComment}
                renderDots={renderScoreDots}
              />
              <ScoreRow
                label="음악적 요소"
                score={feedbackResult.feedback.musicalElementScore}
                comment={feedbackResult.feedback.musicalElementComment}
                renderDots={renderScoreDots}
              />
              <ScoreRow
                label="상투어"
                score={feedbackResult.feedback.clicheScore}
                comment={feedbackResult.feedback.clicheComment}
                renderDots={renderScoreDots}
              />
              <ScoreRow
                label="글 구조"
                score={feedbackResult.feedback.structureScore}
                comment={feedbackResult.feedback.structureComment}
                renderDots={renderScoreDots}
              />
              <ScoreRow
                label="개인 스토리"
                score={feedbackResult.feedback.personalStoryScore}
                comment={feedbackResult.feedback.personalStoryComment}
                renderDots={renderScoreDots}
              />
            </div>

            {/* 종합 점수 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  종합: {feedbackResult.feedback.overallScore.toFixed(1)}/5
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {feedbackResult.feedback.overallComment}
              </p>
            </div>

            {/* 감지된 상투어 */}
            {(() => {
              const detected: string[] = JSON.parse(
                feedbackResult.feedback!.detectedCliches
              );
              if (detected.length === 0) return null;
              return (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    감지된 상투어
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detected.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 개선 제안 */}
            {(() => {
              const suggestions: string[] = JSON.parse(
                feedbackResult.feedback!.suggestions
              );
              if (suggestions.length === 0) return null;
              return (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    개선 제안
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  score,
  comment,
  renderDots,
}: {
  label: string;
  score: number;
  comment: string;
  renderDots: (score: number) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {renderDots(score)}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {score}/5
          </span>
        </div>
      </div>
      {expanded && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {comment}
        </p>
      )}
    </div>
  );
}
