/**
 * @file supabase/functions/notify-request-status/index.ts
 * @description 구장 추가 요청 상태 변경 시 요청자 이메일 알림 발송
 *
 * 환경변수 (Supabase Secrets):
 *   RESEND_API_KEY  — Resend 대시보드(https://resend.com)에서 발급
 *   FROM_EMAIL      — 발신 주소 (예: noreply@yourdomain.com)
 *                     도메인 미인증 시 기본값: onboarding@resend.dev (테스트 전용)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface NotifyPayload {
  courseName: string;
  status: 'completed' | 'rejected';
  toEmail: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const payload: NotifyPayload = await req.json();
    const { courseName, status, toEmail } = payload;

    if (!courseName || !status || !toEmail) {
      return new Response(
        JSON.stringify({ error: '필수 파라미터 누락: courseName, status, toEmail' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev';

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY 환경변수가 설정되지 않았습니다.' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const isApproved = status === 'completed';
    const subject = isApproved
      ? `[골프 스코어] '${courseName}' 구장 추가 요청이 승인되었습니다`
      : `[골프 스코어] '${courseName}' 구장 추가 요청이 반려되었습니다`;

    const html = isApproved
      ? buildApprovedHtml(courseName)
      : buildRejectedHtml(courseName);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('[notify-request-status] Resend API 오류:', errBody);
      return new Response(
        JSON.stringify({ error: `이메일 발송 실패: ${errBody}` }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[notify-request-status] 예외 발생:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

function buildApprovedHtml(courseName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 8px;">
      <h2 style="color: #0A2647; margin-bottom: 8px;">구장 추가 요청 승인</h2>
      <p style="color: #495057; line-height: 1.6;">
        안녕하세요.<br/>
        요청하신 <strong>${courseName}</strong> 구장이 <strong style="color: #2ECC71;">승인</strong>되었습니다.
      </p>
      <p style="color: #495057; line-height: 1.6;">
        이제 앱에서 해당 구장을 검색하고 스코어를 기록하실 수 있습니다.
      </p>
      <hr style="border: none; border-top: 1px solid #dee2e6; margin: 24px 0;" />
      <p style="color: #adb5bd; font-size: 12px;">골프 스코어 앱 운영팀</p>
    </div>
  `;
}

function buildRejectedHtml(courseName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 8px;">
      <h2 style="color: #0A2647; margin-bottom: 8px;">구장 추가 요청 반려</h2>
      <p style="color: #495057; line-height: 1.6;">
        안녕하세요.<br/>
        요청하신 <strong>${courseName}</strong> 구장 추가 요청이 <strong style="color: #e74c3c;">반려</strong>되었습니다.
      </p>
      <p style="color: #495057; line-height: 1.6;">
        구장명, 코스 구성 등 정보를 다시 확인하신 후 재요청해 주시면 검토하겠습니다.
      </p>
      <hr style="border: none; border-top: 1px solid #dee2e6; margin: 24px 0;" />
      <p style="color: #adb5bd; font-size: 12px;">골프 스코어 앱 운영팀</p>
    </div>
  `;
}
