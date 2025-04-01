import { NextResponse } from 'next/server';
import { fetchWithAuth, fetchWithAuthValid } from '@/utils/api';
import { userinfo } from '@/utils/userinfo';

/**
 * 사용자 목록 조회
 * 1. client_credentials token 가져오기
 * 2. 사용자 목록 조회
 * 3. 사용자 데이터에 값 추가
 * @returns 
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

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

    // 2. 사용자 목록 조회
    const res_user = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
    });

    let data_user = await res_user.json();

    // 3. 사용자 데이터에 값 추가
    let data_user_manager = []
    let data_user_manager_user = []
    for(var idx in data_user){
      if (data_user[idx].attributes.type == 'customer'){
        continue;
      } else {
        if (role) { //role 파라미터가 존재하는 경우, user type 조회(role이 user여도 type이 vendor일 경우 전체조회)
          const data_userinfo = await userinfo();
          const user_companytype = data_userinfo.attributes.type[0]
          const user_company_id = data_userinfo.attributes.company_id[0]
          if (user_companytype == data_user[idx].attributes.type && user_company_id == data_user[idx].attributes.company_id) {
            data_user_manager_user.push(data_user[idx])
          }
        } else {
          data_user_manager.push(data_user[idx])
        }
      }

      // json 항목 담기(attributes: { type: [ 'vendor' ], telnum: [ '02-000-0000' ] })
      data_user[idx].type = data_user[idx].attributes.type
      data_user[idx].telnum = data_user[idx].attributes.telnum
      data_user[idx].company_id = data_user[idx].attributes.company_id

      const res = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${data_user[idx].id}/role-mappings/realm`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client_token.access_token}`,
        }
      });

      // 파트너/고객 메뉴에서 담당자 목록 조회 (파트너/고객 id를 통해 회사이름 가져오기)
      if (data_user[idx].type[0] !== 'vendor') {
        const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data_user[idx].type[0]}/${data_user[idx].company_id[0]}`);
        const company = await response.json();
        data_user[idx].company = company.name
      } else {
        data_user[idx].company = 'ABLECLOUD'
      }
    }

    if (role) {
      data_user = data_user_manager_user
    } else {
      data_user = data_user_manager
    }

    if (!res_user.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data_user.message || '사용자 조회에 실패했습니다.'
        },
        { status: res_user.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data_user || []
    });
  } catch (error) {
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