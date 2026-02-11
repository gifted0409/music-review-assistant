"use client";

import { useState, useEffect, useCallback } from "react";
import type { Cliche } from "@/types";

export default function SettingsPage() {
  const [cliches, setCliches] = useState<Cliche[]>([]);
  const [loading, setLoading] = useState(true);

  // 새 상투어 폼
  const [newExpression, setNewExpression] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAlternative, setNewAlternative] = useState("");
  const [addError, setAddError] = useState("");

  const fetchCliches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cliches");
      const data = await res.json();
      if (data.success) {
        setCliches(data.data);
      }
    } catch {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCliches();
  }, [fetchCliches]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newExpression.trim()) {
      setAddError("상투어 표현을 입력해주세요.");
      return;
    }
    setAddError("");

    try {
      const res = await fetch("/api/cliches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression: newExpression.trim(),
          category: newCategory.trim() || undefined,
          alternative: newAlternative.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewExpression("");
        setNewCategory("");
        setNewAlternative("");
        fetchCliches();
      } else {
        setAddError(data.error ?? "추가에 실패했습니다.");
      }
    } catch {
      setAddError("네트워크 오류가 발생했습니다.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("이 상투어를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/cliches?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCliches();
      }
    } catch {
      // 에러 처리
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        설정
      </h1>

      {/* 상투어 추가 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          상투어 추가
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="상투어 표현 *"
              value={newExpression}
              onChange={(e) => setNewExpression(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm"
            />
            <input
              type="text"
              placeholder="카테고리 (선택)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm"
            />
            <input
              type="text"
              placeholder="대안 표현 (선택)"
              value={newAlternative}
              onChange={(e) => setNewAlternative(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
            >
              추가
            </button>
            {addError && <p className="text-red-500 text-sm">{addError}</p>}
          </div>
        </form>
      </section>

      {/* 상투어 목록 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          상투어 목록 ({cliches.length}개)
        </h2>

        {loading ? (
          <p className="text-gray-500">불러오는 중...</p>
        ) : cliches.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            등록된 상투어가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  <th className="pb-2 pr-4">표현</th>
                  <th className="pb-2 pr-4">카테고리</th>
                  <th className="pb-2 pr-4">대안</th>
                  <th className="pb-2 pr-4">감지 횟수</th>
                  <th className="pb-2 pr-4">타입</th>
                  <th className="pb-2">관리</th>
                </tr>
              </thead>
              <tbody>
                {cliches.map((cliche) => (
                  <tr
                    key={cliche.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">
                      {cliche.expression}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                      {cliche.category ?? "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {cliche.alternative ?? "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          cliche.usageCount > 0
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                        }`}
                      >
                        {cliche.usageCount}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`text-xs ${
                          cliche.isDefault
                            ? "text-violet-500"
                            : "text-gray-400"
                        }`}
                      >
                        {cliche.isDefault ? "기본" : "사용자"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleDelete(cliche.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
