# 작업 지시서 — v0.2e
# Screen 10: 카드뉴스 만들기 + Screen 11: 채점 결과 + Screen 12: 역량 지형도

---

## 이 파일의 작업 범위

- **수정 대상**: `index.html` 내 `screen-cardnews`, `screen-result`, `screen-radar` 섹션
- **작업 내용**: 카드뉴스 편집 UI, 공통 채점 결과 화면, 역량 레이더 차트 구현
- **건드리지 말 것**: 다른 화면, CSS 변수, localStorage 키, 라우팅 구조

---

# Screen 10 — 카드뉴스 만들기 (비판적 표현)

## 상단 미션 배너

```
┌─────────────────────────────────┐
│ ✏️ 카드뉴스 만들기               │  ← (--color-cardnews 배경, 초록)
│ 진짜 뉴스를 만들어라!            │
│ 지구 환경을 주제로 카드뉴스를    │
│ 직접 만들어봐! 🌍               │
└─────────────────────────────────┘
```

## 카드뉴스 편집 UI

미리보기 카드 + 입력 폼이 함께 보이는 구조.

### 미리보기 카드 (상단)

```
┌─────────────────────────────────┐
│  📋 내 카드뉴스 미리보기         │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │  [선택한 이미지 이모지]    │  │  ← 선택한 이미지 실시간 반영
│  │                           │  │     height: 160px
│  │  [입력한 제목]             │  │  ← 제목 실시간 반영 (굵게)
│  │                           │  │
│  │  [입력한 메시지]           │  │  ← 메시지 실시간 반영
│  │                           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

학생이 입력할 때마다 미리보기 카드에 실시간 반영됨 (input 이벤트).

### 입력 폼 (하단)

```
┌─────────────────────────────────┐
│                                 │
│  1️⃣ 이미지 선택                 │
│  ┌────┐  ┌────┐  ┌────┐       │
│  │ 🌍 │  │ 🌳 │  │ 🗑️ │       │  ← 3개 선택지 (탭으로 선택)
│  │지구│  │나무│  │쓰레│       │     선택 시 테두리 강조
│  └────┘  └────┘  └────┘       │
│                                 │
│  2️⃣ 카드뉴스 제목               │
│  클릭베이트 없이, 구체적으로!   │
│  ┌─────────────────────────┐   │
│  │                         │   │  ← input (maxlength="30")
│  └─────────────────────────┘   │
│  0 / 30자                      │
│                                 │
│  3️⃣ 핵심 메시지                 │
│  수치나 사실을 넣으면 더 좋아!  │
│  ┌─────────────────────────┐   │
│  │                         │   │  ← textarea (maxlength="100")
│  │                         │   │
│  └─────────────────────────┘   │
│  0 / 100자                     │
│                                 │
│  4️⃣ 이미지 선택 이유             │
│  왜 이 이미지를 골랐어?         │
│  ┌─────────────────────────┐   │
│  │                         │   │  ← input (최소 10자)
│  └─────────────────────────┘   │
│  0 / 10자 이상                  │
│                                 │
│  [ 카드뉴스 완성! 🎉 ]          │  ← 모든 항목 입력 시 활성화
└─────────────────────────────────┘
```

## 제출 조건

```javascript
// 모두 충족해야 버튼 활성화
const isValid =
  selectedImage !== null &&        // 이미지 선택됨
  title.length >= 5 &&             // 제목 5자 이상
  message.length >= 10 &&          // 메시지 10자 이상
  imageReason.length >= 10;        // 이미지 이유 10자 이상
```

## 데이터 저장

```javascript
const cardnewsResult = {
  selectedImage: 'earth',     // 'earth' | 'tree' | 'trash'
  title: studentTitle,
  message: studentMessage,
  imageReason: studentReason,
  score: 65,
  grade: '중',
  completed: true,
};
localStorage.setItem(STORAGE_KEYS.ACTIVITY_CARDNEWS, JSON.stringify(cardnewsResult));
```

---

# Screen 11 — AI 채점 결과 (공통, 더미 버전)

> 이 화면은 5개 활동 **모두 공유**하는 공통 결과 화면입니다.  
> v0.2에서는 AI 없이 **고정 더미값**으로 표시합니다.  
> v0.3에서 실제 Claude API로 교체합니다.

## UI 구조

```
┌─────────────────────────────────┐
│  [활동명] 결과                  │  ← 동적으로 활동명 표시
│  (예: 📺 유튜브 탐정 결과)      │
│                                 │
│         🥈                      │  ← 등급 이모지
│      중  (65점)                 │  ← 등급 + 점수 (크게)
│                                 │
│  ┌───────────────────────────┐  │
│  │ 💬 AI 선생님 피드백        │  │  ← 피드백 카드
│  │                           │  │
│  │ AI 선생님이 곧 진짜        │  │
│  │ 피드백을 줄 거야!          │  │
│  │ 지금은 연습 모드야 😊      │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🤔 생각해볼 질문           │  │  ← 심화 질문 카드
│  │                           │  │
│  │ "클릭베이트를 피하려면     │  │  ← 활동별 더미 질문
│  │  어떤 습관이 필요할까?"    │  │
│  └───────────────────────────┘  │
│                                 │
│  [ 홈으로 돌아가기 🏠 ]         │
└─────────────────────────────────┘
```

## 등급별 이모지 + 색상

```javascript
const GRADE_DISPLAY = {
  '상': { emoji: '🥇', color: '#FFD700', bg: '#FFF9E6' },
  '중': { emoji: '🥈', color: '#4488FF', bg: '#EFF5FF' },
  '하': { emoji: '🥉', color: '#FF8C42', bg: '#FFF3EC' },
};
```

## 활동별 더미 심화 질문

```javascript
const DUMMY_QUESTIONS = {
  youtube: '클릭베이트 영상을 만드는 사람들은 왜 이런 제목을 쓰는 걸까?',
  news: '기사를 쓸 때 완전히 공정하게 쓰는 게 가능할까?',
  ad: '광고라는 걸 표시하지 않는 게 왜 문제가 될까?',
  ai: '정보를 퍼뜨리기 전에 어떻게 확인하는 습관을 만들 수 있을까?',
  cardnews: '좋은 카드뉴스 제목은 클릭베이트 제목과 어떻게 다를까?',
};
```

## 화면 진입 방식

```javascript
// 활동 완료 시 활동 ID를 함께 전달
function goToResult(activityId) {
  currentActivity = activityId; // 전역 변수로 현재 활동 기억
  showScreen(SCREENS.RESULT);
}

// screen-result 진입 시 currentActivity를 보고 UI 구성
```

---

# Screen 12 — 역량 지형도 + 종합 피드백

## 진입 조건

```javascript
// 3개 이상 완료 시 홈 런처에서 버튼 활성화
const completedCount = getCompletedCount(); // localStorage에서 계산
if (completedCount >= 3) {
  radarBtn.disabled = false;
  radarBtn.style.background = 'var(--color-primary)';
}
```

## UI 구조

```
┌─────────────────────────────────┐
│  {이름}의 미디어 탐정            │
│  역량 지도! 🗺️                  │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   [레이더 차트 - Canvas]   │  │  ← 5각형 레이더 차트
│  │                           │  │     크기: 280x280px
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📺 유튜브 탐정   🥈 중    │  │  ← 활동별 결과 목록
│  │ 📰 뉴스 비교    🥈 중    │  │
│  │ 🔍 광고 탐정   🥈 중    │  │
│  │ 🤖 AI 탐정     ⬜ 미완료 │  │  ← 미완료는 회색
│  │ ✏️ 카드뉴스    🥈 중    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🤖 AI 선생님 종합 피드백  │  │
│  │                           │  │
│  │ (더미 텍스트)              │  │
│  │ 잘 했어! v0.3에서         │  │
│  │ 진짜 피드백이 나올 거야    │  │
│  └───────────────────────────┘  │
│                                 │
│  [ 처음부터 다시 도전하기! 🔄 ] │  ← localStorage 초기화 + Screen 1
└─────────────────────────────────┘
```

## 레이더 차트 구현 (Canvas API)

외부 라이브러리 없이 순수 Canvas로 구현.

```javascript
function drawRadarChart(canvas, scores) {
  // scores 예시: { youtube: 65, news: 65, ad: 65, ai: 0, cardnews: 65 }
  // 0 = 미완료 (회색으로 표시)

  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 110; // 최대 반지름

  // 5개 꼭짓점 라벨 및 순서
  const labels = ['클릭베이트\n탐지', '편향성\n분석', '광고\n식별', '허위정보\n탐지', '비판적\n표현'];
  const keys = ['youtube', 'news', 'ad', 'ai', 'cardnews'];
  const n = 5;

  // 각도 계산 (위쪽부터 시계 방향)
  function getAngle(i) {
    return (Math.PI * 2 * i) / n - Math.PI / 2;
  }

  // 1. 배경 격자 (3단계: 하/중/상 = 50/65/85)
  [50, 65, 85].forEach((level, idx) => {
    ctx.beginPath();
    const ratio = level / 100;
    for (let i = 0; i < n; i++) {
      const angle = getAngle(i);
      const x = cx + r * ratio * Math.cos(angle);
      const y = cy + r * ratio * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#E0D8CC';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 2. 중심선
  for (let i = 0; i < n; i++) {
    const angle = getAngle(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = '#E0D8CC';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. 학생 점수 다각형
  ctx.beginPath();
  keys.forEach((key, i) => {
    const score = scores[key] || 0;
    const ratio = score / 100;
    const angle = getAngle(i);
    const x = cx + r * ratio * Math.cos(angle);
    const y = cy + r * ratio * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(78, 205, 196, 0.35)';  // --color-secondary 반투명
  ctx.fill();
  ctx.strokeStyle = '#4ECDC4';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 4. 꼭짓점 점
  keys.forEach((key, i) => {
    const score = scores[key] || 0;
    const ratio = score / 100;
    const angle = getAngle(i);
    const x = cx + r * ratio * Math.cos(angle);
    const y = cy + r * ratio * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = score > 0 ? '#4ECDC4' : '#CCCCCC';
    ctx.fill();
  });

  // 5. 라벨 (꼭짓점 바깥쪽)
  ctx.font = '11px Noto Sans KR';
  ctx.fillStyle = '#2D2D2D';
  ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    const angle = getAngle(i);
    const labelR = r + 28;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);
    const lines = label.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x, y + li * 14);
    });
  });
}
```

## 더미 종합 피드백 (v0.2)

```javascript
const DUMMY_SUMMARY_FEEDBACK =
  'AI 선생님이 열심히 분석 중이야! v0.3에서 진짜 맞춤 피드백이 나올 거야 😊 지금은 연습 모드!';
```

## "처음부터 다시 도전하기" 기능

```javascript
function resetApp() {
  // localStorage 전체 초기화
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  // 시작 화면으로 이동
  showScreen(SCREENS.START);
}
```

---

## v0.2 전체 완료 기준

- [ ] Screen 10: 카드뉴스 편집 UI 작동, 미리보기 실시간 반영
- [ ] Screen 10: 이미지 3종 선택 가능
- [ ] Screen 10: 4개 입력 항목 모두 채워야 제출 활성화
- [ ] Screen 11: 5개 활동 공통 결과 화면 (활동명 동적 표시)
- [ ] Screen 11: 더미 등급(중/65점) + 더미 피드백 + 활동별 더미 질문 표시
- [ ] Screen 12: 3개 이상 완료 시 홈 런처 버튼 활성화
- [ ] Screen 12: Canvas 레이더 차트 렌더링 (외부 라이브러리 없이)
- [ ] Screen 12: 미완료 활동은 차트에서 회색(0)으로 표시
- [ ] Screen 12: "처음부터 다시 도전하기" → localStorage 초기화 + 시작 화면
- [ ] **v0.2 통합 테스트**: API 없이 앱 전체 플로우 처음~끝 완주 가능
