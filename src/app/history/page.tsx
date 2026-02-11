"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReviewWithFeedback, PaginatedResponse } from "@/types";

export default function HistoryPage() {
  const [reviews, setReviews] = useState<ReviewWithFeedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        const paginated: PaginatedResponse<ReviewWithFeedback> = data.data;
        setReviews(paginated.items);
        setTotal(paginated.total);
        setTotalPages(paginated.totalPages);
      }
    } catch {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleDelete(id: number) {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchReviews();
      }
    } catch {
      // 에러 처리
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        리뷰 기록
      </h1>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="아티스트, 앨범, 리뷰 내용으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          검색
        </button>
      </form>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        총 {total}개의 리뷰
      </p>

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">불러오는 중...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {search ? "검색 결과가 없습니다." : "아직 작성한 리뷰가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {review.artistName && (
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                        {review.artistName}
                      </span>
                    )}
                    {review.albumName && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        — {review.albumName}
                      </span>
                    )}
                    {review.genre && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {review.genre}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                    {review.content}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>{new Date(review.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span>{review.charCount}자</span>
                    {review.feedback && (
                      <span className="text-violet-500">
                        종합 {review.feedback.overallScore.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === review.id ? null : review.id)
                    }
                    className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    {expandedId === review.id ? "접기" : "상세"}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 상세 피드백 */}
              {expandedId === review.id && review.feedback && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <FeedbackItem
                      label="감상 구체성"
                      score={review.feedback.specificityScore}
                      comment={review.feedback.specificityComment}
                    />
                    <FeedbackItem
                      label="음악적 요소"
                      score={review.feedback.musicalElementScore}
                      comment={review.feedback.musicalElementComment}
                    />
                    <FeedbackItem
                      label="상투어"
                      score={review.feedback.clicheScore}
                      comment={review.feedback.clicheComment}
                    />
                    <FeedbackItem
                      label="글 구조"
                      score={review.feedback.structureScore}
                      comment={review.feedback.structureComment}
                    />
                    <FeedbackItem
                      label="개인 스토리"
                      score={review.feedback.personalStoryScore}
                      comment={review.feedback.personalStoryComment}
                    />
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">종합:</span>{" "}
                      {review.feedback.overallComment}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackItem({
  label,
  score,
  comment,
}: {
  label: string;
  score: number;
  comment: string;
}) {
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900 dark:text-white">
          {label}
        </span>
        <span className="text-violet-600 dark:text-violet-400">
          {score}/5
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-xs">{comment}</p>
    </div>
  );
}
