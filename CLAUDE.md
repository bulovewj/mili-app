# CLAUDE.md — 미리(MIRI) 프로젝트

> 이 파일은 Claude Code가 프로젝트를 작업할 때 반드시 먼저 읽어야 하는 규칙 문서입니다.  
> 모든 작업 세션 시작 전에 이 파일을 숙지하고, 아래 규칙을 절대적으로 따르세요.

---

## 1. 프로젝트 목적 및 주요 기능 요약

### 목적
초등 5~6학년 학생이 스마트폰·태블릿 브라우저에서 접속하여,  
실생활 미디어 환경을 시뮬레이션하며 **비판적 미디어 리터러시 역량**을 기르는 AI 기반 교육 앱.

### 핵심 사용자
- **학생**: 초등 5~6학년, 스마트폰·갤럭시 탭으로 수업 중 접속
- **교사**: 수업 중 앱 URL을 학생에게 공유하는 방식으로 활용

### 주요 기능 5가지
| 기능 | 설명 |
|------|------|
| Module 01 진단 | 4문항 객관식으로 초기 미디어 리터러시 수준 진단 |
| 5개 시뮬레이션 활동 | 유튜브·뉴스·SNS·카카오톡·카드뉴스 UI를 재현한 실전 탐정 활동 |
| AI 루브릭 채점 | Claude API로 서술형 답변을 상/중/하로 채점 + 피드백 생성 |
| 역량 지형도 | 5개 활동 점수를 레이더 차트로 시각화 |
| 맞춤 피드백 | AI가 전체 결과를 분석해 강점·성장포인트 종합 피드백 생성 |

---

## 2. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 구현 방식 | **단일 HTML 파일 (index.html)** | 설치 없이 URL 하나로 접속 가능 |
| 언어 | HTML5 + CSS3 + Vanilla JS (ES6+) | 외부 프레임워크 의존성 없음 |
| 폰트 | Google Fonts — Noto Sans KR | 한국어 웹폰트, CDN 허용 목록 |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | 루브릭 채점 + 피드백 생성 |
| 저장 | localStorage | 서버 없이 기기 내 저장 |
| 차트 | Canvas API 또는 순수 SVG | 외부 차트 라이브러리 금지 |
| 배포 | Netlify (정적 파일 호스팅) | 드래그앤드롭 업로드, 무료 |

---

## 3. 폴더 구조

```
miri-app/
├── CLAUDE.md              ← 이 파일 (Claude Code 규칙)
├── index.html             ← 앱 전체 (HTML + CSS + JS 모두 포함)
├── miri_app_instructions.md   ← 앱 전체 기능 명세서
├── miri_dev_plan.md           ← 전체 개발 계획 및 마일스톤
├── task_mvp_v0.1.md           ← MVP 작업 지시서
└── (향후 추가 예정)
    ├── task_v0.2.md
    ├── task_v0.3.md
    └── task_v0.4.md
```

> ⚠️ **index.html 하나만 완성하면 됩니다.**  
> CSS 파일 분리, JS 파일 분리 절대 금지. 모든 코드는 index.html 안에.

---

## 4. 개발 시 지켜야 할 규칙

### 4-1. 파일 규칙 (절대 규칙)

```
✅ DO     : index.html 1개 파일에 모든 HTML, CSS, JS 작성
✅ DO     : Google Fonts CDN 링크 1개만 허용
✅ DO     : SVG 인라인 코드로 아이콘/일러스트 구현
❌ DON'T  : CSS 파일 분리 (style.css 등 별도 파일 생성 금지)
❌ DON'T  : JS 파일 분리 (app.js 등 별도 파일 생성 금지)
❌ DON'T  : 이미지 파일 사용 (jpg, png, gif, webp 등)
❌ DON'T  : 외부 이미지 URL 사용 (unsplash, picsum 등)
❌ DON'T  : React, Vue, jQuery, Bootstrap, Chart.js 등 외부 라이브러리
```

### 4-2. 디자인 규칙

```
✅ DO     : CSS 변수(--color-*)로 컬러 시스템 관리
✅ DO     : 버튼 최소 높이 56px (터치 친화적)
✅ DO     : 모든 카드/컨테이너 border-radius: 16px 이상
✅ DO     : 화면 최대 너비 480px, 가운데 정렬
✅ DO     : 화면 전환 시 fadeIn 애니메이션 적용
❌ DON'T  : 흰 배경에 보라색 그라디언트 (흔한 AI 디자인 금지)
❌ DON'T  : Inter, Roboto, Arial, system-ui 폰트 사용
❌ DON'T  : 텍스트 크기 14px 미만 (모바일 가독성)
```

### 4-3. CSS 변수 (반드시 이 값 사용)

```css
:root {
  --color-primary: #FF6B6B;
  --color-primary-light: #FFE5E5;
  --color-secondary: #4ECDC4;
  --color-accent: #FFE66D;
  --color-bg: #FFF9F0;
  --color-card: #FFFFFF;
  --color-text: #2D2D2D;
  --color-text-sub: #888888;
  --color-border: #F0E8D8;
  --color-youtube: #FF4444;
  --color-news: #4488FF;
  --color-ad: #FFB800;
  --color-ai: #9B59B6;
  --color-cardnews: #27AE60;
}
```

### 4-4. localStorage 규칙

```javascript
// 반드시 이 키 이름만 사용 (임의로 키 추가 금지)
const STORAGE_KEYS = {
  NAME: 'miri_student_name',
  DIAGNOSIS_SCORE: 'miri_diagnosis_score',
  DIAGNOSIS_GRADE: 'miri_diagnosis_grade',
  ACTIVITY_YOUTUBE: 'miri_activity_youtube',   // {score, grade, completed}
  ACTIVITY_NEWS: 'miri_activity_news',
  ACTIVITY_AD: 'miri_activity_ad',
  ACTIVITY_AI: 'miri_activity_ai',
  ACTIVITY_CARDNEWS: 'miri_activity_cardnews',
};
```

### 4-5. Claude API 규칙

> API 보안 규칙은 반드시 `miri_app_instructions.md` 섹션 9를 따른다.
> 실제 API 키는 `index.html` 또는 브라우저 코드에 절대 넣지 않는다.

```javascript
// 프론트엔드는 프로젝트 서버리스 함수만 호출한다.
// 실제 ANTHROPIC_API_KEY는 Netlify 환경변수에만 저장한다.
const API_ENDPOINT = "/.netlify/functions/grade";

// temperature 고정 (채점 일관성)
const TEMPERATURE = 0;

// API 호출 실패 처리 (필수)
// 1회 재시도 후 실패 시 → 사용자에게 친근한 안내 메시지 표시
// 앱이 멈추거나 흰 화면이 되어선 안 됨
```

### 4-6. 한국어 규칙

```
✅ DO     : 모든 UI 텍스트 한국어
✅ DO     : 학생 호칭은 "{이름}아/야" (받침 유무에 따라 자동 처리)
✅ DO     : 친근하고 귀여운 말투 (초등학생 대상)
✅ DO     : 이모지 적극 활용
❌ DON'T  : 영어 버튼 텍스트 (Submit, Cancel, Next 등)
❌ DON'T  : 딱딱한 공문체
```

받침 유무 처리 예시:
```javascript
function addPostposition(name) {
  const lastChar = name[name.length - 1];
  const code = lastChar.charCodeAt(0);
  const hasBatchim = (code - 0xAC00) % 28 !== 0;
  return name + (hasBatchim ? '아' : '야');
}
// 예: "원진" → "원진아", "수아" → "수아야"
```

### 4-7. 안전 필터링 규칙

- 학생 서술형 답변에 욕설/혐오표현 포함 시 → AI 채점 거부 + 재입력 안내
- 시스템 프롬프트에 반드시 포함:
  ```
  욕설, 개인정보, 혐오표현이 포함된 경우 평가를 거부하고
  "다시 써줘" 안내만 출력해. 절대 점수를 주지 마.
  ```
- 챗봇 응답 범위를 미디어 리터러시 주제로만 제한

### 4-8. 접근성 및 성능 규칙

```
✅ DO     : 모든 버튼에 cursor: pointer
✅ DO     : input에 font-size: 16px 이상 (iOS 자동 확대 방지)
✅ DO     : 로딩 중 버튼 비활성화 + 로딩 표시
✅ DO     : API 호출 중 사용자에게 "AI 선생님이 답변 중이에요... ⏳" 표시
❌ DON'T  : API 호출 중 화면 전체를 block하는 모달
❌ DON'T  : console.log를 프로덕션 코드에 남기기
```

---

## 5. 화면 ID 목록 (라우팅 기준)

```javascript
// 이 ID를 사용해 화면 전환 구현 (임의 변경 금지)
screen-start           // 시작 화면 (이름 입력)
screen-intro           // 앱 소개 화면
screen-diagnosis       // Module 01 진단 퀴즈
screen-diagnosis-result // 진단 결과
screen-home            // 홈 런처
screen-youtube         // 유튜브 탐정
screen-news            // 뉴스 비교
screen-ad              // 광고 탐정
screen-ai              // AI 탐정
screen-cardnews        // 카드뉴스 만들기
screen-result          // AI 루브릭 채점 결과
screen-radar           // 역량 지형도 + 종합 피드백
```

---

## 6. 버전별 작업 범위 요약

| 버전 | 핵심 작업 | 참고 지시서 |
|------|----------|------------|
| MVP v0.1 | 뼈대 + 디자인 + 화면 전환 | task_mvp_v0.1.md |
| v0.2 | 진단 문항 + 5개 시뮬레이션 콘텐츠 | task_v0.2.md (예정) |
| v0.3 | Claude API 루브릭 채점 연동 | task_v0.3.md (예정) |
| v0.4 | 안정화 + 엣지케이스 처리 | task_v0.4.md (예정) |
| v1.0.0 | 최종 배포 | — |

---

## 7. 작업 시작 전 체크리스트

Claude Code는 매 작업 세션 시작 전 다음을 확인:

- [ ] 현재 버전이 몇인지 확인 (task_*.md 참조)
- [ ] index.html 파일 구조가 단일 파일인지 확인
- [ ] CSS 변수가 CLAUDE.md 기준값과 동일한지 확인
- [ ] localStorage 키 이름이 CLAUDE.md 기준과 동일한지 확인
- [ ] 외부 라이브러리 import 없는지 확인 (Google Fonts만 허용)

---

*프로젝트 오너: 김원진 | 부산대학교 AI융합교육전공 석사과정*  
*지도교수: 남윤경 교수*
