import { NextResponse } from 'next/server';
import { fetchWithAuth, fetchWithAuthValid } from '@/utils/api';
import log from '@/utils/logger';

/**
 * keycloak에서 사용자 정보 가져오기
 * @returns 
 */
export async function GET(request: Request) {
  try {
    // 1. 사용자 아이디 가져오기
    const res_user = await fetchWithAuth(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data_user = await res_user.json();

    // 2. client_credentials token 가져오기
    const submitData_token = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: process.env.SCOPE,
      grant_type: 'client_credentials',
    }

    const res_token = await fetch(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(submitData_token).toString()
    });

    const client_token = await res_token.json();

    // 3. 사용자 정보 가져오기
    const res_user2 = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${data_user.sub}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
    });
    if (!res_user2.ok) {
      throw new Error(data_user.message || '사용자 조회에 실패했습니다.');
    }
    const data_userinfo = await res_user2.json();

    // 4. 파트너 회사이름 가져오기
    let partner
    if (data_userinfo.attributes.type[0] == 'partner'){
      const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/partner/${data_userinfo.attributes.company_id}`);
      partner = await response.json();
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: partner || [],
    });
  } catch (error) {
    log.info('GET /user/userinfo ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '사용자 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}