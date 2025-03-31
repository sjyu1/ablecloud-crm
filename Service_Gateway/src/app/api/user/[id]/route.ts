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

    // json 항목 담기(attributes: { type: [ 'vendor' ], telnum: [ '02-000-0000' ] })
    data_user.type = data_user.attributes.type
    data_user.telnum = data_user.attributes.telnum
    data_user.company_id = data_user.attributes.company_id[0]

    // 파트너/고객 id를 통해 회사이름 가져오기
    if (data_user.type == 'vendor') {
      data_user.company = 'ABLECLOUD'
    } else {
      const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data_user.type}/${data_user.company_id}`);
      const company = await response.json();
      data_user.company = company.name
    }

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

/**
 * 사용자 수정
 * 1. client_credentials token 가져오기
 * 2. 사용자 삭제
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

    // 2. 사용자 수정
    const body = await request.json();
    const { firstName, lastName, email, telnum, type, company_id} = body;
    const attributes = {
      telnum : telnum,
      type,
      company_id : [company_id]
    }
    const submitData = {
      firstName,
      lastName,
      email,
      // enabled: true,
      // emailVerified: false,
      attributes
    }

    const response = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${params.id}`,{
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
      message: '사용자가 수정되었습니다.' 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '사용자 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 사용자 삭제
 * 1. client_credentials token 가져오기
 * 2. 사용자 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
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

    // 2. 사용자 삭제
    const response = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${params.id}`,{
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
    });

    if (!response) {
      return NextResponse.json(
        { message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // licenses = licenses.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '사용자가 삭제되었습니다.' 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}