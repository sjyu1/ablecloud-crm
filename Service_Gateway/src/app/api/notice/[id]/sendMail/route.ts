import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import nodemailer from 'nodemailer';
import log from '@/utils/logger';

/**
 * 공지사항 파트너 메일 보내기
 * @param request 
 * @param params 
 * @returns 
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /notice/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/notice/${params.id}`);
    const notice = await response.json();
    //('GET /notice/'+params.id+' DATA ::: '+JSON.stringify(notice));

    const body = await request.json();
    const users = body.users;

    const transporter = nodemailer.createTransport({
      host: 'mail.ablecloud.io',
      port: 25,
      secure: false,
    });

    // 선택한 사용자에 메일 전송
    for (const user of users) {
      if (!user.email) continue;

      await transporter.sendMail({
        from: 'ablecloud@ablecloud.io',
        to: user.email,
        subject: '[ABLECLOUD 공지사항] '+notice.title,
        text: notice.content,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <hr style="border:none; border-top:1px solid #ddd;" />
            <p>${notice.content.replace(/\n/g, '<br>')}</p>
            <hr style="border:none; border-top:1px solid #ddd;" />
            <footer style="margin-top: 20px; font-size: 12px; color: #999;">
              문의사항은 아래 전화 및 메일로 문의바랍니다.<br>
              대표전화 : 1544-3696<br>
              영업 : sales@ablestack.co.kr<br>
              기술지원 : support@ablestack.co.kr
            </footer>
          </div>
        `,
      });

      log.info(`메일 전송 완료: ${user.email}`);
    }

    if (!notice) {
      return NextResponse.json(
        { message: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: notice
    });
  } catch (error) {
    log.info('GET /notice/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '공지사항 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}