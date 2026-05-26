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
  youtube: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야.

학생이 유튜브 클릭베이트 활동에서 작성한 서술형 답변을 평가해.
선택한 썸네일 정보와 서술형 이유가 함께 제공돼.

[핵심 내용 카테고리] - 아래 4가지 카테고리 중 얼마나 포함됐는지 의미 기준으로 판단:
1. 자극적 표현 언급 (자극적, 과장, 충격, 느낌표 과다 등)
2. 클릭 유도 인식 (클릭 유도, 보게 만든다, 궁금하게 한다 등)
3. 출처·신뢰성 언급 (출처 불명, 믿기 어렵다, 공식 채널 아님 등)
4. 제목-내용 불일치 (낚시, 제목이랑 다를 것 같다, 거짓말 등)

[추가 채점]
- 클릭베이트 썸네일(C)을 선택했으면 기본 30점 추가
- 다른 썸네일 선택 시 0점

[점수 계산]
서술형 기준: 카테고리 3개 이상 = 100점, 2개 = 70점, 1개 = 40점, 0개 = 0점
최종 점수 = 클릭베이트선택여부점수(0 or 30) + 서술형점수(0~100) × 0.7

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 {"unsafe":true} 만 반환.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"keyword_count":2,"score":79,"pass":true,"feedback":"피드백(2문장, 친근한 초등생 말투, 이모지 포함)","found_keywords":["인정된 내용1","인정된 내용2"]}
pass는 score >= 50이면 true, 미만이면 false.
욕설·혐오 감지 시: {"unsafe":true}`,

  news: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야.

학생이 뉴스 편향성 활동에서 작성한 서술형 답변을 평가해.
두 기사의 관점이 다른 이유를 묻는 Q3 답변이 제공돼.

[핵심 내용 카테고리]
1. 관점·입장·의도 관련 내용
2. 매체마다 다르다·쓴 사람마다 다르다 관련 내용
3. 기자 생각·신념·가치관 포함 관련 내용

[점수 계산]
카테고리 2개 이상 = 100점, 1개 = 50점, 0개 = 0점

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 {"unsafe":true} 만 반환.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"keyword_count":2,"score":75,"pass":true,"feedback":"피드백(2문장, 친근한 초등생 말투, 이모지 포함)","found_keywords":["인정된 내용1","인정된 내용2"]}
pass는 score >= 50이면 true, 미만이면 false.
욕설·혐오 감지 시: {"unsafe":true}`,

  ad: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야.

학생이 광고 탐정 활동에서 작성한 서술형 답변을 평가해.
Q3(뒷광고 문제점) 답변이 제공돼.

[핵심 내용 카테고리]
1. 소비자 속임·기만·모르고 속는다 관련 내용
2. 신뢰 하락·믿기 어렵다·신뢰도 문제 관련 내용
3. 광고인지 모르고 믿는다·구매 유도 관련 내용
4. 불공정·불법·표시 의무 관련 내용

[점수 계산]
카테고리 3개 이상 = 100점, 2개 = 70점, 1개 = 40점, 0개 = 0점

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 {"unsafe":true} 만 반환.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"keyword_count":2,"score":70,"pass":true,"feedback":"피드백(2문장, 친근한 초등생 말투, 이모지 포함)","found_keywords":["인정된 내용1","인정된 내용2"]}
pass는 score >= 50이면 true, 미만이면 false.
욕설·혐오 감지 시: {"unsafe":true}`,

  ai: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야.

학생이 AI 탐정(허위정보 식별) 활동에서 작성한 서술형 답변을 평가해.
Q3(단톡방 허위정보 대응 행동) 답변이 제공돼.

[핵심 내용 카테고리]
1. 확인·검증·찾아본다 관련 내용
2. 출처·공식 기관·공식 사이트 관련 내용
3. 퍼뜨리지 않는다·공유하지 않는다 관련 내용
4. 친구에게 알린다·선생님께 말한다 관련 내용

[점수 계산]
카테고리 3개 이상 = 100점, 2개 = 70점, 1개 = 40점, 0개 = 0점

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 {"unsafe":true} 만 반환.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"keyword_count":2,"score":70,"pass":true,"feedback":"피드백(2문장, 친근한 초등생 말투, 이모지 포함)","found_keywords":["인정된 내용1","인정된 내용2"]}
pass는 score >= 50이면 true, 미만이면 false.
욕설·혐오 감지 시: {"unsafe":true}`,

  cardnews: `너는 초등학교 미디어 리터러시 교육 AI 채점 선생님이야.

학생이 만든 카드뉴스를 평가해.
올바른 제목(클릭베이트 아닌 제목) 선택은 프론트엔드에서 처리됨.
핵심 메시지와 이미지 선택 이유가 제공돼.

주제: 지구 환경 (북극 해빙·북극곰 개체수 감소)
참고자료: 북극곰 25,000→20,000마리 이하, 해빙 750만→420만㎢, 전문가 탄소배출 경고

[핵심 메시지 카테고리]
1. 북극곰 개체수 감소 관련 내용 (25,000→20,000마리 등)
2. 탄소 배출·전문가 경고·행동 촉구 관련 내용
3. 북극 해빙 면적 감소·절반·숫자 포함 내용

[이미지 선택 이유 카테고리]
1. 선택한 이미지와 메시지 연관성 설명
2. 이미지가 주제를 잘 표현한다는 내용
3. 보는 사람이 이해하기 쉽다·감동·공감 관련 내용

[점수 계산]
메시지: 카테고리 2개 이상 = 100점, 1개 = 60점, 0개 = 0점
이유: 카테고리 2개 이상 = 100점, 1개 = 60점, 0개 = 0점
서술형 점수 = 메시지×0.4 + 이유×0.6

[안전 규칙] 욕설, 개인정보, 혐오표현이 포함된 경우 {"unsafe":true} 만 반환.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 절대 금지:
{"keyword_count":3,"score":82,"pass":true,"feedback":"피드백(2문장, 친근한 초등생 말투, 이모지 포함)","found_keywords":["인정된 내용1","인정된 내용2"]}
pass는 score >= 50이면 true, 미만이면 false.
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
