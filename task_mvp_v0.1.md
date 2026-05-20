# 작업 지시서 — MVP v0.1
# 미리(MIRI) 앱 : 뼈대 + 화면 흐름 구현

---

## 이 지시서의 목적

Claude Code에게 전달하는 첫 번째 작업 지시서입니다.  
**단일 HTML 파일(index.html) 1개**로 앱의 전체 뼈대와 화면 이동 흐름을 구현합니다.  
이 단계에서는 콘텐츠보다 **구조, 디자인, 화면 전환**이 핵심입니다.

---

## 절대 규칙 (반드시 지켜야 함)

1. **파일 1개만**: `index.html` 단일 파일에 HTML + CSS + JS 모두 포함
2. **외부 라이브러리 금지**: Google Fonts CDN만 허용. jQuery, Bootstrap, React 등 일절 사용 금지
3. **이미지 파일 금지**: 모든 시각 요소는 CSS 또는 SVG로 구현 (외부 URL 이미지 금지)
4. **한국어 전용**: 모든 텍스트, 버튼, 안내문 한국어로
5. **모바일 퍼스트**: 기준 뷰포트 390px. 768px에서도 자연스럽게 보여야 함
6. **CLAUDE.md 준수**: 프로젝트 폴더의 CLAUDE.md 규칙을 항상 따를 것

---

## 구현할 화면 목록 (MVP 범위)

### Screen 1 — 시작 화면

```
[앱 로고: 돋보기+미디어 아이콘 (CSS/SVG로 구현)]

미리(MIRI)
미디어를 똑똑하게 읽는 탐정 🔍

[ 이름을 입력해줘! ] ← input 필드

[ 시작하기 ]  ← 이름 입력 전 비활성화(회색), 입력 후 활성화
```

- 이름 입력 시 localStorage에 `miri_student_name` 키로 저장
- 앱 재접속 시 이름이 저장되어 있으면 Screen 1 건너뛰고 Screen 5(홈 런처)로 바로 이동
- "시작하기" 클릭 → Screen 2로 이동

---

### Screen 2 — 앱 소개 화면

```
{이름}아, 반가워! 👋

미리는 가짜 뉴스, 클릭베이트, 광고를
찾아내는 미디어 탐정 앱이야!

5가지 미션을 완료하면
너만의 역량 지도가 완성돼! 🗺️

[5개 활동 아이콘 미리보기 - 작은 원형 아이콘 5개]
📺  📰  🔍  🤖  ✏️
유튜브  뉴스  광고  AI  카드
탐정   비교  탐정  탐정  뉴스

[ 미션 시작! ]
```

- "미션 시작!" 클릭 → Screen 3으로 이동

---

### Screen 3 — Module 01 진단 퀴즈 (더미)

MVP에서는 실제 문항 내용 없이 **UI 구조만** 구현

```
[상단 진행바: ●●○○ 2/4]

Q2. 문항 텍스트가 여기에 들어갑니다

① 선택지 A
② 선택지 B  ← 선택 시 파란 테두리+체크 표시
③ 선택지 C
④ 선택지 D

[ 다음 → ]  ← 선택 후 활성화
```

- 4문항 하드코딩 (실제 문항 내용은 v0.2에서 추가)
- 현재는 더미 문항으로 UI만 완성
- 4문항 완료 → Screen 4로 이동

---

### Screen 4 — 진단 결과 화면 (더미)

```
{이름}의 미디어 탐정 레벨

🕵️
탐정

"미디어 정보를 꽤 잘 읽는구나!
5가지 미션으로 실력을 더 키워보자!"

[ 5가지 미션 도전하기! ]
```

- MVP에서는 등급 고정(더미), 실제 채점은 v0.2에서 연동
- 버튼 클릭 → Screen 5로 이동

---

### Screen 5 — 홈 런처

```
{이름}의 미션 현황
[진행률 바: 0 / 5 완료]

┌─────────────────────────────┐
│ 📺  유튜브 탐정              │
│     클릭베이트를 찾아라!     │
│                    [도전!]  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 📰  뉴스 비교                │
│     편향성을 발견하라!       │
│                    [도전!]  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🔍  광고 탐정                │
│     숨은 광고를 잡아라!      │
│                    [도전!]  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🤖  AI 탐정                  │
│     가짜 정보를 탐지하라!    │
│                    [도전!]  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ✏️  카드뉴스                  │
│     진짜 뉴스를 만들어라!    │
│                    [도전!]  │
└─────────────────────────────┘

[역량 지형도 보기] ← 3개 이상 완료 시 활성화 (MVP에서는 항상 비활성)
```

- 각 카드 "[도전!]" 버튼 클릭 시 → 해당 Screen으로 이동 (MVP에서는 더미 화면 or "준비중" 안내)
- 완료한 활동 카드: 배경 흐릿하게 + ✅ 체크 표시 + 등급 뱃지

---

## 디자인 시스템 (반드시 이 값으로 구현)

### 컬러 팔레트

```css
:root {
  --color-primary: #FF6B6B;      /* 메인 산호빨강 */
  --color-primary-light: #FFE5E5;
  --color-secondary: #4ECDC4;    /* 민트 */
  --color-accent: #FFE66D;       /* 노랑 */
  --color-bg: #FFF9F0;           /* 크림 배경 */
  --color-card: #FFFFFF;
  --color-text: #2D2D2D;
  --color-text-sub: #888888;
  --color-border: #F0E8D8;
  
  /* 활동별 컬러 */
  --color-youtube: #FF4444;
  --color-news: #4488FF;
  --color-ad: #FFB800;
  --color-ai: #9B59B6;
  --color-cardnews: #27AE60;
}
```

### 폰트

```html
<!-- Google Fonts: Noto Sans KR만 사용 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
```

```css
body { font-family: 'Noto Sans KR', sans-serif; }
```

### 공통 컴포넌트 스타일

```css
/* 버튼 기본 */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 700;
  min-height: 56px;
  width: 100%;
  cursor: pointer;
}

/* 카드 */
.card {
  background: var(--color-card);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 12px;
}

/* 화면 컨테이너 */
.screen {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: 100vh;
  background: var(--color-bg);
}
```

### 화면 전환 애니메이션

```css
.screen { animation: fadeIn 0.3s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## JS 라우팅 구조

```javascript
// 화면 ID 목록
const SCREENS = {
  START: 'screen-start',
  INTRO: 'screen-intro',
  DIAGNOSIS: 'screen-diagnosis',
  DIAGNOSIS_RESULT: 'screen-diagnosis-result',
  HOME: 'screen-home',
  ACTIVITY_YOUTUBE: 'screen-youtube',
  ACTIVITY_NEWS: 'screen-news',
  ACTIVITY_AD: 'screen-ad',
  ACTIVITY_AI: 'screen-ai',
  ACTIVITY_CARDNEWS: 'screen-cardnews',
  RESULT: 'screen-result',
  RADAR: 'screen-radar',
};

// 화면 전환 함수
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(screenId).style.display = 'block';
  window.scrollTo(0, 0);
}
```

---

## localStorage 구조

```javascript
// MVP에서 사용하는 키만
const STORAGE_KEYS = {
  NAME: 'miri_student_name',
  DIAGNOSIS_SCORE: 'miri_diagnosis_score',
  DIAGNOSIS_GRADE: 'miri_diagnosis_grade',
  ACTIVITY_YOUTUBE: 'miri_activity_youtube',
  ACTIVITY_NEWS: 'miri_activity_news',
  ACTIVITY_AD: 'miri_activity_ad',
  ACTIVITY_AI: 'miri_activity_ai',
  ACTIVITY_CARDNEWS: 'miri_activity_cardnews',
};

// 활동 결과 저장 형태
// { score: 85, grade: "상", completed: true }
```

---

## MVP 완료 체크리스트

Claude Code는 아래 항목을 모두 구현한 후 완료로 간주:

- [ ] index.html 단일 파일로 모든 코드 포함
- [ ] Screen 1~5 화면 전환 정상 작동
- [ ] 이름 입력 → localStorage 저장 → 모든 화면에서 이름 표시
- [ ] 재접속 시 이름 있으면 홈 런처로 바로 이동
- [ ] 390px 모바일에서 레이아웃 깨지지 않음
- [ ] 768px 태블릿에서도 자연스럽게 보임
- [ ] 디자인 시스템 CSS 변수 적용됨
- [ ] 화면 전환 페이드 애니메이션 작동
- [ ] 홈 런처 5개 활동 카드 표시 (더미 화면 연결)
- [ ] 버튼 최소 높이 56px, 터치하기 편한 크기

---

## 다음 버전 예고 (v0.2에서 할 일)

이 지시서에서 **하지 않아도 되는 것들**:
- 실제 진단 문항 내용 (더미 OK)
- 5개 시뮬레이션 화면 실제 콘텐츠
- Claude API 연동
- 레이더 차트 실제 데이터 연동
