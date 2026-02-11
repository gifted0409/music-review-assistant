# CLAUDE.md - 작업 가이드

## 프로젝트 개요
음악 리뷰 피드백 도우미 - 네이버 블로그 앨범 감상 리뷰 품질 체크 도구

## 효과적인 작업 방식

### 1. 기존 프로젝트 패턴 먼저 탐색
- 새 프로젝트 시작 전 기존 프로젝트(budget-tracker)의 코드 패턴을 Explore 에이전트로 탐색
- 싱글톤 패턴, API 응답 구조, 레이아웃 등을 일관되게 재사용

### 2. Phase별 구현 + 중간 빌드 확인
- 5개 Phase로 나누어 순차 구현 (세팅 → 리서치 → 피드백 → 기록/분석 → 설정)
- 각 Phase 완료 후 `npx next build`로 빌드 확인 → 에러 즉시 수정
- TypeScript strict 모드이므로 타입 에러를 빌드 단계에서 조기 발견

### 3. 품질 개선은 분석 → 플랜 → 구현 순서
- 기능 품질 이슈 발생 시 Plan 모드로 진입
- Explore 에이전트로 관련 코드 전체 탐색 + 문제점 분석
- Plan 에이전트로 구체적 구현 계획 설계
- 승인 후 Task 목록 만들어 순차/병렬 구현

### 4. 외부 API 통합 시 무료 + 안정 우선
- 유료 API 대신 무료 API 우선 (MusicBrainz: 무료, 인증 불필요)
- 웹 스크래핑보다 구조화된 API 데이터가 품질 높음
- AI 내장 지식을 "사실 앵커" + 보완 지식으로 활용하는 하이브리드 전략
- rate limit 준수 필수 (MusicBrainz 1.1초 대기)

### 5. AI 응답 견고성 확보
- 3단계 JSON 파싱: 순수 JSON → 코드블록 → brace 추출
- 필드별 타입/길이 검증 (validateResearchResponse)
- 파싱 실패 시 null 반환 (데이터 오염 방지)
- temperature 0.3으로 사실 기반 응답 유도
- 프롬프트에 환각 방지 3원칙: 사실 우선 → 지식 보완 → 환각 금지

### 6. 한국어 + 영문 호환성
- 한국어 아티스트명 → MusicBrainz alias 검색으로 영문명 자동 변환
- Wikipedia 영문 + 한국어 동시 수집
- 프롬프트에 한국어 응답 명시

## 기술 규칙
- Gemini SDK 싱글톤: `src/lib/gemini.ts` (globalThis 패턴)
- Prisma 싱글톤: `src/lib/prisma.ts` (BetterSQLite3 어댑터)
- 모든 API: `ApiResponse<T>` 타입 (`{ success, data?, error? }`)
- 스키마 변경 후: `npx prisma migrate dev` → `npx prisma generate`
- 테스트: `npx next build`로 빌드 성공 확인
