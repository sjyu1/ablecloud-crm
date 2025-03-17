import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';

/**
 * 사용자 상세 조회
 * 1. client_credentials token 가져오기
 * 2. 사용자 정보 가져오기
 * 3. 사용자 정보에 role 추가
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. client_credentials token 가져오기
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

    // 2. 사용자 정보 가져오기
    const res_user = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
    });

    const data_user = await res_user.json();
    
    // 3. 사용자 정보에 role 추가
    const res_role = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${params.id}/role-mappings/realm`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      }
    });

    const data_role = await res_role.json();

    for(var idx in data_role){
      if(data_role[idx].name === "Admin" || data_role[idx].name === "User"){
        data_user.role = data_role[idx].name
      }
    }

    if (!data_user) {
      return NextResponse.json(
        { message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: data_user 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}