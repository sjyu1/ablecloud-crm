import { NextResponse } from 'next/server';
import log from '@/utils/logger';

export async function GET() {
  log.info('API URL ::: GET /api/logout');

  const loginUrl = new URL('/login', process.env.FRONTEND_URL);
  loginUrl.searchParams.set('message', '로그인 유효시간이 지나 로그아웃됩니다.');

  const response = NextResponse.redirect(loginUrl);

  // 쿠키 삭제
  const expired = new Date(0);
  const cookieOptions = { path: '/', expires: expired };
  response.cookies.set('companyId', '', cookieOptions);
  response.cookies.set('role', '', cookieOptions);
  response.cookies.set('token', '', cookieOptions);
  response.cookies.set('userId', '', cookieOptions);
  response.cookies.set('username', '', cookieOptions);

  return response;
}
