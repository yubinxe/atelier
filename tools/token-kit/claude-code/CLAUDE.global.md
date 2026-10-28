<!-- token-kit:start -->
## 토큰 절약 (전역)
- 응답 형식은 출력 스타일 Caveman 을 따른다.
- 검색 먼저, 필요한 범위만 읽기. 같은 파일 재독 금지. 독립 도구 호출은 묶기.
- 긴 출력은 tail·grep 으로 자르기. 작업 끝나면 /clear, 길어지면 /compact.
- 이 파일과 프로젝트 CLAUDE.md 는 짧게 유지(매 요청마다 읽힌다).
<!-- token-kit:end -->
