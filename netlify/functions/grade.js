// netlify/functions/grade.js
// MIRI 앱 — Claude API 프록시 서버리스 함수
// API 키는 Netlify 환경변수 ANTHROPIC_API_KEY 에서만 읽음

const https = require('https');

const MODEL       = 'claude-sonnet-4-5';
const TEMPERATURE = 0;
const MAX_ANSWER_LENGTH = 1000;
const ALLOWED_IDS = ['youtube', 'news', 'ad', 'ai', 'cardnews', 'summary'];

// 루브릭 및 시스템 프롬프트 — 서버에서만 보관
const RUBRICS = {
  youtube: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야. 초등 5~6학년 학생의 클릭베이트 식별 능력을 평가해.

[제시된 유튜브 영상]
영상 A: "초등학생도 쉽게 배우는 태양계 행성 이야기" — 정상 영상
영상 B: "이거 보면 진짜 충격... 학교에서 절대 안 알려주는 비밀 (100%실화)" — 클릭베이트 영상
영상 C: "우리나라 전통 놀이 종류와 방법 소개" — 정상 영상

[채점 기준]
상(85점): 영상 B를 클릭베이트로 선택 + "과장된 표현", "낚시성 제목", "거짓 호기심 자극" 등 구체적 이유를 1가지 이상 언급
중(65점): 영상 B 선택했으나 이유가 막연함("이상해 보여서" 등), 또는 B 아닌 것 선택했으나 클릭베이트 개념 이해가 엿보임
하(50점): 선택이 틀렸거나 이유가 매우 짧고 피상적

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 평가를 거부하고 "다시 써줘" 안내만 출력해. 절대 점수를 주지 마.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"grade":"상","score":85,"feedback":"피드백 내용(2~3문장, 잘한 점 강조, 초등생 말투, 이모지 포함)","question":"심화 생각 질문(물음표로 끝남)"}
등급에 따라 grade는 "상"|"중"|"하", score는 85|65|50 중 하나.
욕설·혐오 감지 시: {"unsafe":true}`,

  news: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야. 초등 5~6학년 학생의 뉴스 편향성 분석 능력을 평가해.

[활동 내용]
두 기사를 읽고 차이점과 편향성에 대해 서술했어.
기사 A(건강한급식신문): 학교 채식의 날 도입의 긍정적 측면 중심
기사 B(학부모뉴스): 학교 채식의 날 도입에 대한 학부모 반발·갈등 중심

[채점 기준]
상(85점): 두 기사가 서로 다른 관점으로 쓰였음을 파악하고 그 이유(매체 성격, 이해관계, 관점 차이 등)를 구체적으로 설명
중(65점): 두 기사가 다르다는 건 인식했으나 이유 설명이 막연함("느낌이 달라서" 등)
하(50점): 단순 비교에 그치거나 한쪽 기사만 언급

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 평가를 거부하고 "다시 써줘" 안내만 출력해. 절대 점수를 주지 마.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"grade":"상","score":85,"feedback":"피드백 내용(2~3문장, 잘한 점 강조, 초등생 말투, 이모지 포함)","question":"심화 생각 질문(물음표로 끝남)"}
등급에 따라 grade는 "상"|"중"|"하", score는 85|65|50 중 하나.
욕설·혐오 감지 시: {"unsafe":true}`,

  ad: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야. 초등 5~6학년 학생의 광고·협찬 식별 능력을 평가해.

[SNS 게시물]
게시물 A(초등탐구생활): 광합성 실험 일반 게시물 — 광고 아님
게시물 B(키즈인플루언서_민준): "[광고]" 표시된 문구점 협찬 게시물 — 명시적 광고
게시물 C(책읽는아이_수아): 광고 표시 없이 문제집을 강하게 추천 — 숨은 광고 (핵심 학습 목표!)

[채점 기준]
상(85점): 게시물 C(숨은 광고)를 선택 + "광고 표시 없음", "자연스럽게 추천", "협찬인지 모름" 등 핵심 이유 언급 (B만 선택하면 최대 중)
중(65점): B만 선택(명시적 광고 인식) + 이유 적절, 또는 B+C 선택했으나 C 이유가 약함
하(50점): A만 선택하거나 이유가 매우 짧음

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 평가를 거부하고 "다시 써줘" 안내만 출력해. 절대 점수를 주지 마.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"grade":"상","score":85,"feedback":"피드백 내용(2~3문장, 잘한 점 강조, 초등생 말투, 이모지 포함)","question":"심화 생각 질문(물음표로 끝남)"}
등급에 따라 grade는 "상"|"중"|"하", score는 85|65|50 중 하나.
욕설·혐오 감지 시: {"unsafe":true}`,

  ai: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야. 초등 5~6학년 학생의 허위조작정보 탐지 능력을 평가해.

중요: 이 활동의 목표는 "정답 맞추기"가 아니라 "의심하는 태도와 이유 말하기"야.
카카오톡 단톡방에서 "기상청 발표: 내일 전국 모든 학교 휴교!!"라는 메시지가 올라왔어. 출처는 불명확하고 이미지만 첨부됨.

[채점 기준]
상(85점): 의심스러운 이유를 구체적으로 서술 ("출처가 없어서", "공식 기관에서 확인 못 해서", "SNS 공유가 많다고 사실은 아니잖아" 등)
중(65점): 의심스럽다고 언급했으나 이유가 단순하거나 막연함 ("왠지 가짜 같아서")
하(50점): 의심 이유를 전혀 설명 못 하거나, 이유가 거의 없음

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 평가를 거부하고 "다시 써줘" 안내만 출력해. 절대 점수를 주지 마.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"grade":"상","score":85,"feedback":"피드백 내용(2~3문장, 잘한 점 강조, 초등생 말투, 이모지 포함)","question":"심화 생각 질문(물음표로 끝남)"}
등급에 따라 grade는 "상"|"중"|"하", score는 85|65|50 중 하나.
욕설·혐오 감지 시: {"unsafe":true}`,

  cardnews: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야. 초등 5~6학년 학생이 직접 만든 환경 주제 카드뉴스를 평가해.

카드뉴스 구성: 이미지 선택(지구/나무/쓰레기통), 제목, 핵심 메시지, 이미지 선택 이유

[채점 기준]
상(85점): 제목이 명확하고, 핵심 메시지가 구체적인 사실·행동을 담고 있으며, 이미지 선택 이유가 메시지와 논리적으로 연결됨
중(65점): 내용이 있으나 메시지가 막연하거나("환경을 지켜야 해") 이미지 선택 이유가 약함
하(50점): 내용이 매우 짧거나, 이미지 선택 이유가 없거나, 메시지가 거의 없음

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 평가를 거부하고 "다시 써줘" 안내만 출력해. 절대 점수를 주지 마.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"grade":"상","score":85,"feedback":"피드백 내용(2~3문장, 잘한 점 강조, 초등생 말투, 이모지 포함)","question":"심화 생각 질문(물음표로 끝남)"}
등급에 따라 grade는 "상"|"중"|"하", score는 85|65|50 중 하나.
욕설·혐오 감지 시: {"unsafe":true}`,

  summary: `너는 초등학교 미디어 리터러시 교육 AI 종합 피드백 선생님이야.
학생의 5가지 활동 결과를 바탕으로 종합 피드백을 작성해.
규칙: 3~4문장, 친근한 초등생 말투, 잘한 점 1가지 + 더 키울 점 1가지 포함, 이모지 2~3개.
순수 텍스트로만 응답. JSON, 마크다운, 별표(*) 금지.`,
};

// -------------------------------------------------------

exports.handler = async (event) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
  const requestOrigin = event.headers.origin || event.headers.Origin || '';
  const originOk = !allowedOrigin || requestOrigin === allowedOrigin;
  const corsOrigin = originOk ? (requestOrigin || '*') : '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  console.log('[MIRI] method:', event.httpMethod, '| origin:', requestOrigin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (!originOk) {
    console.error('[MIRI] 403 origin blocked:', requestOrigin);
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 요청 파싱
  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch (_) {
    console.error('[MIRI] 400 invalid JSON, body:', event.body);
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { activityId, studentAnswer } = parsed;
  console.log('[MIRI] activityId:', activityId, '| answerLen:', studentAnswer && studentAnswer.length);

  // 입력값 검증
  if (!ALLOWED_IDS.includes(activityId)) {
    console.error('[MIRI] 400 invalid activityId:', activityId);
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid activityId' }) };
  }
  if (!studentAnswer || typeof studentAnswer !== 'string' || studentAnswer.trim().length === 0) {
    console.error('[MIRI] 400 missing answer');
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing studentAnswer' }) };
  }
  if (studentAnswer.length > MAX_ANSWER_LENGTH) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Answer too long' }) };
  }

  // API 키 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[MIRI] 503 no API key');
    return { statusCode: 503, headers: corsHeaders, body: JSON.stringify({ error: 'Service not configured' }) };
  }
  console.log('[MIRI] calling Claude, model:', MODEL);

  const isSummary = activityId === 'summary';
  const reqBody = JSON.stringify({
    model: MODEL,
    max_tokens: isSummary ? 400 : 300,
    temperature: TEMPERATURE,
    system: RUBRICS[activityId],
    messages: [{ role: 'user', content: studentAnswer }],
  });

  try {
    const claudeRes = await callClaude(apiKey, reqBody);
    let text = claudeRes.content[0].text.trim();
    // 모델이 ```json ... ``` 으로 감쌀 경우 제거
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    if (isSummary) {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ summary: text }) };
    }
    const gradeData = JSON.parse(text);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(gradeData) };
  } catch (err) {
    console.error('[MIRI] Claude call failed:', err.message);
    return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: 'AI service unavailable' }) };
  }
};

function callClaude(apiKey, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('[MIRI] Claude API status:', res.statusCode, '| body:', data);
          reject(new Error('Claude API error ' + res.statusCode));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
