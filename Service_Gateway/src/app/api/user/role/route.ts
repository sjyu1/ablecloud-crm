import { NextResponse } from 'next/server';
import { fetchWithAuth, fetchWithAuthValid } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 사용자 Role 목록 조회
 * 1. client_credentials token 가져오기
 * 2. 사용자 Role 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /user/role');
    const { searchParams } = new URL(request.url);

    // 1. client_credentials token 가져오기
    const submitData_token = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: process.env.SCOPE,
      grant_type: 'client_credentials',
    }

    const res_token = await fetchWithAuthValid(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(submitData_token).toString()
    });

    const client_token = await res_token.json();

    // 2. 사용자 Role 목록 조회
    const res_user = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
    });

    const data_user = await res_user.json();
    //log.info('GET /user/role DATA ::: '+JSON.stringify(data_user));

    if (!res_user.ok) {
      throw new Error(data_user.message || '사용자 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data_user || []
    });
  } catch (error) {
    log.info('GET /user/role ERROR ::: '+error);
    if (error instanceof Error){ 
      return NextResponse.json(
        { 
          success: false,
          message: error.message
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: '서버 오류가 발생했습니다.'
        },
        { status: 500 }
      );
    }

  }
}