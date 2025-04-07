import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';

/**
 * 사용자 비밀번호 변경
 * 1. client_credentials token 가져오기
 * 2. 사용자 비밀번호 변경
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function PUT(
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

    // 2. 사용자 비밀번호 변경
    const body = await request.json();
    const { newPassword } = body;

    const submitData = {
      "temporary" : false,
      "type" : "password",
      "value" : newPassword
    }

    const response = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${params.id}/reset-password`,{
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
      body: JSON.stringify(submitData),
    });

    if (!response.ok) {
      const data = await response.json();

      return NextResponse.json(
        { message: data.error },
        { status: 401 }
      );
    }

    if (!response) {
      return NextResponse.json(
        { message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      message: '사용자 비밀번호가 변경되었습니다.' 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '사용자 비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}