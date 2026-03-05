import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

interface ImportRequest {
  mode: 'url' | 'text';
  url?: string;
  text?: string;
}

interface HoleData {
  holeNumber: number;
  par: number;
  distanceMeter: number | null;
  distanceYard: number | null;
}

interface CourseData {
  courseName: string;
  holes: HoleData[];
}

interface ParseResult {
  clubName: string;
  courses: CourseData[];
  confidence: 'high' | 'medium' | 'low';
}

const PROMPT_TEMPLATE = (content: string) => `
다음은 골프장 코스 소개 페이지의 내용입니다.
코스별 홀 정보를 추출하여 아래 JSON 형식으로만 반환하세요. 설명 없이 JSON만 출력하세요.

출력 형식:
{
  "clubName": "구장 전체명",
  "courses": [
    {
      "courseName": "A코스",
      "holes": [
        { "holeNumber": 1, "par": 4, "distanceMeter": 385, "distanceYard": 421 }
      ]
    }
  ],
  "confidence": "high"
}

규칙:
- par는 반드시 3, 4, 5 중 하나
- distanceMeter: 미터 단위. 야드만 있으면 ×0.9144 변환 후 정수로 반올림. 없으면 null
- distanceYard: 야드 단위. 없으면 null
- 여러 티(레드/화이트/블루)는 블루티(최장) 기준
- 확신 불가한 값은 null 처리 후 confidence를 "low"로 설정
- confidence 기준:
  - high: Par 합계 정확 + 전장 80% 이상 존재 + 코스명 명확
  - medium: Par 합계 정확 + 전장 일부 누락 또는 코스명 불명확
  - low: Par 합계 오류 또는 홀 정보 대량 누락

내용:
${content}`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 40000);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mode, url, text }: ImportRequest = await req.json();

    let inputContent: string;

    if (mode === 'url') {
      if (!url) {
        return new Response(
          JSON.stringify({ error: 'MISSING_URL', message: 'url 파라미터가 필요합니다.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let res: Response;
      try {
        res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000),
        });
      } catch (fetchErr) {
        return new Response(
          JSON.stringify({
            error: 'FETCH_FAILED',
            message: '페이지를 불러올 수 없습니다. 텍스트 붙여넣기 모드를 사용해 주세요.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const html = await res.text();
      inputContent = stripHtml(html);

      // JS 렌더링 필요 사이트 감지 (텍스트가 너무 적음)
      if (inputContent.length < 300) {
        return new Response(
          JSON.stringify({
            error: 'JS_RENDER_REQUIRED',
            message: '이 구장 사이트는 자동 추출이 어렵습니다. 텍스트 붙여넣기 모드를 사용해 주세요.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (mode === 'text') {
      if (!text) {
        return new Response(
          JSON.stringify({ error: 'MISSING_TEXT', message: 'text 파라미터가 필요합니다.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      inputContent = text.substring(0, 40000);
    } else {
      return new Response(
        JSON.stringify({ error: 'INVALID_MODE', message: 'mode는 "url" 또는 "text"이어야 합니다.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gemini Flash 호출
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'CONFIG_ERROR', message: 'GOOGLE_AI_API_KEY가 설정되지 않았습니다.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(PROMPT_TEMPLATE(inputContent));
    const responseText = result.response
      .text()
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    // JSON 파싱 검증
    let parsed: ParseResult;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: 'PARSE_ERROR',
          message: 'AI 응답을 JSON으로 파싱할 수 없습니다. 다시 시도해 주세요.',
          raw: responseText.substring(0, 500),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[course-import] 예상치 못한 오류:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
