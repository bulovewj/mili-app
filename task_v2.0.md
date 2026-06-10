# 작업 지시서 — v2.0
# 방 번호 시스템 + 교사 대시보드 + 콘텐츠 관리

---

## 이 버전의 목표

1. 학생이 **방 번호 + 이름**으로 입장
2. 교사가 **계정으로 로그인**해서 방 생성·관리
3. 교사가 **학생 결과 조회** (수업 후 루브릭 개선용)
4. 교사가 **콘텐츠(문제) 수정·추가** 가능
5. 실시간 없음 — 수업 후 결과 확인 방식

---

## 추가·수정 파일 목록

```
miri-app/
├── index.html                      ← 수정 (방 번호+이름 입력 추가)
├── teacher.html                    ← 신규 (교사 전용 앱)
├── CLAUDE.md                       ← 업데이트
├── netlify/
│   └── functions/
│       ├── grade.js                ← 기존 (변경 금지)
│       ├── auth-signup.js          ← 신규 (교사 회원가입)
│       ├── auth-login.js           ← 신규 (교사 로그인)
│       ├── room-create.js          ← 신규 (방 생성)
│       ├── room-list.js            ← 신규 (방 목록 조회)
│       ├── room-results.js         ← 신규 (방별 학생 결과 조회)
│       ├── student-submit.js       ← 신규 (학생 결과 저장)
│       ├── content-get.js          ← 신규 (콘텐츠 불러오기)
│       └── content-save.js         ← 신규 (콘텐츠 저장)
└── netlify.toml                    ← 업데이트
```

---

## 1. Supabase DB 테이블 설계

### 1-1. teachers (교사 계정)

```sql
create table teachers (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  password_hash text not null,        -- bcrypt 해시
  name         text not null,
  school       text,
  created_at   timestamp default now()
);
```

### 1-2. rooms (수업 방)

```sql
create table rooms (
  id           uuid primary key default gen_random_uuid(),
  room_code    text unique not null,  -- 6자리 숫자 문자열 (예: '847291')
  teacher_id   uuid references teachers(id),
  title        text not null,         -- 방 이름 (예: "6학년 1반 1차시")
  content_id   uuid references contents(id),  -- 사용할 콘텐츠 세트
  is_active    boolean default true,
  created_at   timestamp default now()
);
```

### 1-3. student_results (학생 결과)

```sql
create table student_results (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid references rooms(id),
  student_name    text not null,
  activity_key    text not null,      -- 'youtube' | 'news' | 'ad' | 'ai' | 'cardnews'
  answers         jsonb,              -- 학생 답변 전체
  ai_score        integer,            -- AI 채점 점수
  pass            boolean,
  ai_feedback     text,
  submitted_at    timestamp default now()
);
```

### 1-4. contents (콘텐츠 세트)

```sql
create table contents (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid references teachers(id),
  title        text not null,         -- 콘텐츠 세트 이름 (예: "1회차 기본 세트")
  is_default   boolean default false, -- 기본 내장 콘텐츠 여부
  data         jsonb not null,        -- 전체 콘텐츠 JSON
  created_at   timestamp default now(),
  updated_at   timestamp default now()
);
```

**contents.data JSON 구조:**
```json
{
  "diagnosis": { "questions": [...] },
  "youtube":   { "thumbnails": [...], "essayQuestion": "..." },
  "news":      { "articleA": {...}, "articleB": {...}, "questions": [...] },
  "ad":        { "posts": [...], "questions": [...] },
  "ai":        { "messages": [...], "questions": [...] },
  "cardnews":  { "topic": "...", "referenceData": [...], "titles": [...], "images": [...] }
}
```

---

## 2. Netlify 환경변수 (추가)

```
ANTHROPIC_API_KEY      ← 기존
SUPABASE_URL           ← 신규
SUPABASE_SERVICE_KEY   ← 신규
JWT_SECRET             ← 신규 (교사 세션 토큰용)
```

---

## 3. Netlify 함수 명세

### 3-1. auth-signup.js (교사 회원가입)

```javascript
// POST /.netlify/functions/auth-signup
// body: { email, password, name, school }

// 1. 이메일 중복 확인
// 2. bcrypt로 비밀번호 해시
// 3. teachers 테이블에 삽입
// 4. JWT 토큰 발급 후 반환

// 응답: { token, teacher: { id, email, name, school } }
// 오류: 이메일 중복 시 409, 유효성 실패 시 400
```

### 3-2. auth-login.js (교사 로그인)

```javascript
// POST /.netlify/functions/auth-login
// body: { email, password }

// 1. 이메일로 교사 조회
// 2. bcrypt.compare로 비밀번호 검증
// 3. JWT 토큰 발급

// 응답: { token, teacher: { id, email, name, school } }
// 오류: 이메일 없음/비밀번호 틀림 시 401
```

### 3-3. room-create.js (방 생성)

```javascript
// POST /.netlify/functions/room-create
// headers: { Authorization: 'Bearer {token}' }
// body: { title, contentId }

// 1. JWT 검증
// 2. 6자리 랜덤 코드 생성 (중복 확인)
// 3. rooms 테이블에 삽입

// 응답: { roomCode, roomId, title }
```

### 3-4. room-list.js (방 목록)

```javascript
// GET /.netlify/functions/room-list
// headers: { Authorization: 'Bearer {token}' }

// 1. JWT 검증
// 2. 해당 교사의 방 목록 조회
// 3. 각 방의 학생 수(student_results count)도 포함

// 응답: { rooms: [{ roomCode, title, studentCount, isActive, createdAt }] }
```

### 3-5. room-results.js (학생 결과 조회)

```javascript
// GET /.netlify/functions/room-results?roomCode=847291
// headers: { Authorization: 'Bearer {token}' }

// 1. JWT 검증
// 2. roomCode로 방 조회 + 교사 소유 확인
// 3. 해당 방의 student_results 전체 조회

// 응답: {
//   room: { roomCode, title },
//   students: [
//     {
//       studentName,
//       activities: {
//         youtube: { score, pass, answers, feedback },
//         news: { ... },
//         ...
//       }
//     }
//   ]
// }
```

### 3-6. student-submit.js (학생 결과 저장)

```javascript
// POST /.netlify/functions/student-submit
// body: { roomCode, studentName, activityKey, answers, aiScore, pass, aiFeedback }

// 1. roomCode로 방 조회 + is_active 확인
// 2. student_results 테이블에 저장
//    (같은 방+이름+활동 이미 있으면 UPDATE)

// 응답: { success: true }
```

### 3-7. content-get.js (콘텐츠 불러오기)

```javascript
// GET /.netlify/functions/content-get?contentId=xxx
// (인증 불필요 — 학생도 콘텐츠 불러와야 함)
// roomCode로도 조회 가능: ?roomCode=847291

// 응답: { contentId, title, data: { diagnosis, youtube, news, ... } }
```

### 3-8. content-save.js (콘텐츠 저장)

```javascript
// POST /.netlify/functions/content-save
// headers: { Authorization: 'Bearer {token}' }
// body: { contentId?, title, data }
// contentId 없으면 신규 생성, 있으면 수정

// 응답: { contentId, title }
```

---

## 4. index.html 수정 (학생용)

### 4-1. Screen 01 수정 — 방 번호 + 이름 입력

```html
<!-- 기존 이름 입력 아래에 추가 -->
<div style="margin-top:16px">
  <div class="input-label">선생님께 받은 방 번호 🔑</div>
  <input
    id="room-input"
    type="number"
    inputmode="numeric"
    maxlength="6"
    placeholder="6자리 번호"
    style="width:100%; padding:14px 16px; font-size:28px;
           text-align:center; letter-spacing:8px;
           border:2px solid var(--color-border); border-radius:14px;
           font-family:'Noto Sans KR',sans-serif;"
    oninput="checkStartBtn()"
  />
  <div id="room-error" style="color:#FF4444; font-size:13px;
    margin-top:6px; display:none;">
    방 번호를 다시 확인해줘! 선생님께 여쭤봐 😊
  </div>
</div>
```

**시작 버튼 활성화 조건:**
```javascript
function checkStartBtn() {
  const name = document.getElementById('name-input').value.trim();
  const room = document.getElementById('room-input').value.trim();
  const btn  = document.getElementById('start-btn');
  btn.disabled = !(name.length > 0 && room.length === 6);
}
```

**시작 버튼 클릭 시:**
```javascript
async function startApp() {
  const name     = document.getElementById('name-input').value.trim();
  const roomCode = document.getElementById('room-input').value.trim();
  const btn      = document.getElementById('start-btn');

  btn.disabled = true;
  btn.textContent = '방 확인 중... ⏳';

  try {
    // 콘텐츠 불러오기
    const res = await fetch(`/.netlify/functions/content-get?roomCode=${roomCode}`);
    if (!res.ok) throw new Error('방 없음');
    const { contentId, data } = await res.json();

    // localStorage 저장
    localStorage.setItem('miri_student_name', name);
    localStorage.setItem('miri_room_code', roomCode);
    localStorage.setItem('miri_content_id', contentId);
    localStorage.setItem('miri_room_content', JSON.stringify(data));

    // 콘텐츠 앱에 적용
    applyRoomContent(data);
    showScreen('screen-intro');

  } catch (e) {
    document.getElementById('room-error').style.display = 'block';
    btn.disabled = false;
    btn.textContent = '시작하기';
  }
}
```

### 4-2. 콘텐츠 적용 함수

```javascript
function applyRoomContent(data) {
  // 각 활동별 콘텐츠를 DB에서 불러온 data로 교체
  // 기존 loadRound2Content()와 유사한 방식
  // data.youtube, data.news, data.ad, data.ai, data.cardnews 각각 적용
  // 기존 하드코딩 콘텐츠를 덮어씌움
}
```

### 4-3. 학생 결과 저장 수정

기존 각 `submit*()` 함수에서 localStorage에만 저장하던 것을
**Supabase에도 함께 저장**하도록 수정:

```javascript
async function saveToServer(activityKey, answers, aiScore, pass, aiFeedback) {
  const roomCode   = localStorage.getItem('miri_room_code');
  const studentName = localStorage.getItem('miri_student_name');
  if (!roomCode) return; // 방 번호 없으면 서버 저장 스킵

  try {
    await fetch('/.netlify/functions/student-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode, studentName, activityKey,
        answers, aiScore, pass, aiFeedback
      }),
    });
  } catch (e) {
    // 서버 저장 실패해도 앱은 계속 동작 (localStorage는 이미 저장됨)
    console.warn('서버 저장 실패, localStorage만 유지');
  }
}
```

---

## 5. teacher.html 명세

단일 HTML 파일. index.html과 동일한 디자인 시스템 사용.

### 화면 흐름

```
[T01] 시작 화면 (로그인 / 회원가입 탭)
        ↓ 로그인 성공
[T02] 대시보드 홈 (방 목록 + 빠른 메뉴)
        ↓
    ├── [T03] 방 생성
    ├── [T04] 방 상세 (학생 결과 조회)
    ├── [T05] 콘텐츠 목록
    └── [T06] 콘텐츠 편집기
```

---

### Screen T01 — 로그인 / 회원가입

```
┌────────────────────────────────┐
│  🔍 미리(MIRI)                  │
│  교사 관리 페이지               │
│                                │
│  [ 로그인 ] [ 회원가입 ]        │  ← 탭 전환
│  ─────────────────────────     │
│                                │
│  [로그인 탭]                   │
│  이메일: [____________]        │
│  비밀번호: [____________]      │
│  [ 로그인 ]                    │
│                                │
│  [회원가입 탭]                  │
│  이름: [____________]          │
│  학교: [____________]          │
│  이메일: [____________]        │
│  비밀번호: [____________]      │
│  비밀번호 확인: [_________]    │
│  [ 회원가입 ]                  │
└────────────────────────────────┘
```

**JWT 토큰 저장:**
```javascript
// 로그인/회원가입 성공 시
localStorage.setItem('miri_teacher_token', token);
localStorage.setItem('miri_teacher_info', JSON.stringify(teacher));
// 이후 모든 API 호출에 Authorization 헤더 포함
```

---

### Screen T02 — 대시보드 홈

```
┌────────────────────────────────┐
│  안녕하세요, {이름} 선생님! 👋  │
│  {학교명}                      │
│  [ 로그아웃 ]                  │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 🚪   │ │ 📊   │ │ 📝   │  │
│  │ 방   │ │ 결과 │ │ 콘텐 │  │
│  │ 관리 │ │ 조회 │ │ 츠   │  │
│  └──────┘ └──────┘ └──────┘  │
│                                │
│  최근 방 목록                  │
│  ┌──────────────────────────┐ │
│  │ 847291 | 6학년 1반 1차시  │ │
│  │ 학생 23명 | 2025.06.01   │ │
│  │              [결과 보기] │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 293847 | 6학년 2반 1차시  │ │
│  │ 학생 18명 | 2025.05.30   │ │
│  │              [결과 보기] │ │
│  └──────────────────────────┘ │
│                                │
│  [ + 새 방 만들기 ]            │
└────────────────────────────────┘
```

---

### Screen T03 — 방 생성

```
┌────────────────────────────────┐
│  ← 새 방 만들기                │
│                                │
│  방 이름                       │
│  [6학년 1반 1차시_____________]│
│                                │
│  사용할 콘텐츠 세트             │
│  ┌──────────────────────────┐ │
│  │ ● 기본 내장 콘텐츠        │ │  ← 라디오 버튼
│  │ ○ 1회차 기본 세트        │ │
│  │ ○ 스마트폰 주제 세트      │ │
│  └──────────────────────────┘ │
│                                │
│  [ 방 생성하기 ]               │
└────────────────────────────────┘
```

**방 생성 완료 후:**
```
┌────────────────────────────────┐
│  🎉 방이 만들어졌어요!          │
│                                │
│  학생들에게 알려줄 방 번호:     │
│                                │
│  ┌──────────────────────────┐ │
│  │       8  4  7  2  9  1   │ │  ← 6자리 크게
│  └──────────────────────────┘ │
│                                │
│  [ 📋 번호 복사 ]              │
│  [ 결과 보기 ]                 │
│  [ 대시보드로 ]                │
└────────────────────────────────┘
```

---

### Screen T04 — 방 상세 (학생 결과 조회)

```
┌────────────────────────────────┐
│  ← 847291 | 6학년 1반 1차시    │
│  학생 23명 참여                 │
│  [ 새로고침 🔄 ]               │
│                                │
│  활동별 PASS율                  │
│  📺 유튜브 탐정  ██████░░ 78%  │
│  📰 뉴스 비교    █████░░░ 65%  │
│  🔍 광고 탐정    ███████░ 87%  │
│  🤖 AI 탐정      ████░░░░ 52%  │  ← PASS율 낮은 활동 빨간색
│  ✏️ 카드뉴스     ██████░░ 74%  │
│                                │
│  학생별 결과                   │
│  ┌──────────────────────────┐ │
│  │ 김민준  📺✅ 📰✅ 🔍✅ 🤖❌ ✏️✅│ │
│  │ 이수아  📺✅ 📰❌ 🔍✅ 🤖✅ ✏️⬜│ │  ← ⬜ 미완료
│  │ 박지호  📺❌ 📰✅ 🔍✅ 🤖✅ ✏️✅│ │
│  └──────────────────────────┘ │
│                                │
│  [학생 이름 탭 시 상세 답변 펼치기]
└────────────────────────────────┘
```

**학생 상세 답변 (펼치기):**
```
┌────────────────────────────────┐
│  김민준 — 🤖 AI 탐정 ❌ FAIL   │
│  점수: 35점                    │
│                                │
│  [학생 답변]                   │
│  "지호가 이상한 것 같아서요     │
│   그냥 느낌이 이상해요"         │
│                                │
│  [AI 피드백]                   │
│  "의심하는 태도는 좋아! 근데    │
│   왜 의심스러운지 이유를..."    │
│                                │
│  AI 채점: 35점 (FAIL)          │
│  💬 교사 메모: [____________]  │  ← 교사가 메모 남길 수 있음
└────────────────────────────────┘
```

> 교사 메모는 루브릭 개선 참고용. DB 저장 불필요, localStorage에만 저장해도 됨.

---

### Screen T05 — 콘텐츠 목록

```
┌────────────────────────────────┐
│  ← 콘텐츠 관리                 │
│                                │
│  📦 기본 내장 콘텐츠            │
│  ┌──────────────────────────┐ │
│  │ 기본 세트 (스마트폰 주제)  │ │
│  │ 내장 콘텐츠 · 수정 불가   │ │
│  │              [복사 후 편집]│ │
│  └──────────────────────────┘ │
│                                │
│  📝 내가 만든 콘텐츠            │
│  ┌──────────────────────────┐ │
│  │ 환경 주제 세트             │ │
│  │ 2025.06.01 수정          │ │
│  │         [편집] [삭제]    │ │
│  └──────────────────────────┘ │
│                                │
│  [ + 새 콘텐츠 만들기 ]        │
└────────────────────────────────┘
```

---

### Screen T06 — 콘텐츠 편집기

탭 구조로 활동별 편집.

```
┌────────────────────────────────┐
│  ← 콘텐츠 편집                 │
│  이름: [환경 주제 세트________] │
│                                │
│  [진단] [유튜브] [뉴스] [광고] │  ← 활동 탭
│  [AI탐정] [카드뉴스]           │
│  ─────────────────────────     │
│                                │
│  [유튜브 탐정 탭 선택 시]      │
│                                │
│  썸네일 A (정상)               │
│  채널명: [KBS 뉴스___________] │
│  제목: [_____________________] │
│  조회수: [__________________]  │
│  뱃지: [단독___] 색상: [🔴]   │
│                                │
│  썸네일 B (정상)               │
│  채널명: [__________________]  │
│  제목: [_____________________] │
│                                │
│  썸네일 C (클릭베이트 ✓)       │
│  채널명: [__________________]  │
│  제목: [_____________________] │
│                                │
│  서술형 질문:                  │
│  [왜 클릭베이트라고 생각했어?__]│
│                                │
│  [ 저장하기 ]                  │
└────────────────────────────────┘
```

**각 활동 탭별 편집 가능 항목:**

| 활동 | 편집 가능 항목 |
|------|--------------|
| 진단 퀴즈 | 4문항 텍스트·선택지·정답·개념설명 |
| 유튜브 탐정 | 썸네일 3개 채널명·제목·조회수·클릭베이트 여부, 서술형 질문 |
| 뉴스 비교 | 기사 A·B 매체명·헤드라인·본문, Q1~Q3 텍스트·정답 |
| 광고 탐정 | 게시물 3개 닉네임·내용·광고여부·뱃지, Q1~Q3 |
| AI 탐정 | 채팅방 이름·메시지 목록·의심 메시지 지정, Q1~Q3 |
| 카드뉴스 | 주제·참고자료 3개·제목 선택지 3개·이미지 3개 |

---

## 6. 인증 처리 (teacher.html)

```javascript
// 페이지 로드 시 토큰 확인
function checkAuth() {
  const token = localStorage.getItem('miri_teacher_token');
  if (!token) {
    showScreen('screen-teacher-login');
    return;
  }
  // 토큰 유효성 확인 후 대시보드로
  loadDashboard();
}

// 모든 API 호출에 토큰 포함
async function apiCall(path, options = {}) {
  const token = localStorage.getItem('miri_teacher_token');
  return fetch(`/.netlify/functions/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

// 로그아웃
function logout() {
  localStorage.removeItem('miri_teacher_token');
  localStorage.removeItem('miri_teacher_info');
  showScreen('screen-teacher-login');
}
```

---

## 7. 기본 내장 콘텐츠 DB 초기화

Supabase에 기본 콘텐츠를 미리 삽입해두는 SQL:

```sql
INSERT INTO contents (teacher_id, title, is_default, data)
VALUES (
  NULL,
  '기본 세트 (스마트폰 주제)',
  true,
  '{
    "diagnosis": { ... },   -- 기존 index.html QUIZ_QUESTIONS 내용
    "youtube":   { ... },   -- 기존 YT_THUMBNAILS 내용
    "news":      { ... },   -- 기존 뉴스 기사 내용
    "ad":        { ... },   -- 기존 SNS 게시물 내용
    "ai":        { ... },   -- 기존 카카오톡 내용
    "cardnews":  { ... }    -- 기존 카드뉴스 내용
  }'
);
```

> 실제 JSON 값은 기존 index.html의 하드코딩 콘텐츠를 그대로 옮겨 넣는다.

---

## 8. CLAUDE.md 업데이트 사항

```markdown
## 9. v2.0 추가 규칙

### 인증
- JWT 토큰은 teacher.html의 localStorage에만 저장
- 모든 교사용 Netlify 함수는 JWT 검증 필수
- 학생용 함수(content-get, student-submit)는 인증 불필요

### 데이터 흐름
- 학생 결과: localStorage 저장 + Supabase 저장 (동시)
- 서버 저장 실패해도 앱은 계속 동작 (localStorage 우선)
- 콘텐츠: 방 입장 시 Supabase에서 불러와 localStorage에 캐시

### 보안
- 비밀번호: bcrypt 해시 (평문 저장 절대 금지)
- Supabase KEY는 Netlify 환경변수에만 저장
- 교사가 다른 교사 방 조회 불가 (teacher_id 검증)

### teacher.html 규칙
- index.html과 동일한 CSS 변수 시스템 사용
- 단일 HTML 파일 (CSS, JS 분리 금지)
- 모바일에서도 동작하도록 반응형 유지
```

---

## 9. 완료 기준 체크리스트

### Supabase
- [ ] teachers, rooms, student_results, contents 테이블 생성
- [ ] 기본 내장 콘텐츠 INSERT 완료
- [ ] Netlify 환경변수 4개 설정

### Netlify 함수 (8개)
- [ ] auth-signup.js (회원가입 + JWT 발급)
- [ ] auth-login.js (로그인 + JWT 발급)
- [ ] room-create.js (방 생성 + 6자리 코드)
- [ ] room-list.js (내 방 목록)
- [ ] room-results.js (학생 결과 조회)
- [ ] student-submit.js (학생 결과 저장)
- [ ] content-get.js (콘텐츠 불러오기)
- [ ] content-save.js (콘텐츠 저장)

### index.html (학생용)
- [ ] 방 번호 6자리 입력 필드 추가
- [ ] 시작 시 content-get 호출 + 콘텐츠 적용
- [ ] 각 활동 submit 시 student-submit 호출
- [ ] 서버 저장 실패 시 앱 계속 동작

### teacher.html (교사용)
- [ ] T01: 로그인·회원가입 탭 UI
- [ ] T02: 대시보드 홈 (방 목록)
- [ ] T03: 방 생성 + 6자리 코드 발급
- [ ] T04: 학생 결과 조회 (활동별 PASS율 + 학생별 목록)
- [ ] T04: 학생 상세 답변 펼치기
- [ ] T04: 교사 메모 (localStorage)
- [ ] T05: 콘텐츠 목록 (기본 내장 + 내 콘텐츠)
- [ ] T06: 콘텐츠 편집기 (6개 활동 탭)
- [ ] T06: 저장 → content-save 호출

### 공통
- [ ] CLAUDE.md 업데이트
- [ ] 기존 index.html 화면 ID·localStorage 키·CSS 변수 변경 없음
- [ ] 모바일(390px)·태블릿(768px) 레이아웃 정상
