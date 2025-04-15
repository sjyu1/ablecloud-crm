import { NextResponse } from 'next/server';
import { fetchWithAuth, fetchWithAuthValid } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 사용자 목록 조회
 * 1. client_credentials token 가져오기
 * 2. 사용자 목록 조회
 * 3. 사용자 데이터에 role 추가
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /user');
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const username = searchParams.get('username');

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

    // 3. 사용자 데이터에 role 추가 및 같은 회사 담당자 조회 추가
    let loginuser_companay_id
    let loginuser_type
    let partner_company_type
    let partner_company_id
    let data_user_partner = []
    for(var idx in data_user){
      // json 항목 담기(attributes: { type: [ 'vendor' ], telnum: [ '02-000-0000' ] })
      data_user[idx].type = data_user[idx].attributes.type[0]
      data_user[idx].telnum = data_user[idx].attributes.telnum[0]
      data_user[idx].company_id = data_user[idx].attributes.company_id[0]

      const res = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${data_user[idx].id}/role-mappings/realm`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client_token.access_token}`,
        }
      });
      const data_role = await res.json();

      for (var idx2 in data_role){
        if (data_role[idx2].name === "Admin" || data_role[idx2].name === "User"){
          data_user[idx].role = data_role[idx2].name
        }
      }

      // 파트너/고객 메뉴에서 담당자 목록 조회 (파트너/고객 id를 통해 회사이름 가져오기)
      if (data_user[idx].type == 'vendor') {
        data_user[idx].company = 'ABLECLOUD'
      } else {
        const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data_user[idx].type}/${data_user[idx].company_id}`);
        const company = await response.json();
        data_user[idx].company = company.name
        data_user[idx].user_company_id = company.id
        data_user[idx].user_manager_id = company.manager_id      
      }

      // Role이 User인 경우, 같은 회사 담당자 모두 조회
      if (role && username == data_user[idx].username) {
        loginuser_type = data_user[idx].type
        loginuser_companay_id = data_user[idx].company_id
      }
    }

    for(var idx in data_user){
      // 파트너 로그인시, 관리 고객 사용자 조회
      if (data_user[idx].user_manager_id) {
        const data_userinfo = await userinfo_id(data_user[idx].user_manager_id);
        if (data_userinfo.error)  continue;
        partner_company_type = data_userinfo.attributes.type[0]
        partner_company_id = data_userinfo.attributes.company_id[0]
      }

      if ((loginuser_type == data_user[idx].type && loginuser_companay_id == data_user[idx].company_id) || data_user[idx].type == 'customer' && loginuser_companay_id == partner_company_id) {
        data_user_partner.push(data_user[idx])
      }
    }

    if (role && loginuser_type !== 'vendor') {
      data_user = data_user_partner
    } else {
      data_user.push({'loginuser_type':loginuser_type})
    }

    log.info('GET /user DATA ::: '+JSON.stringify(data_user));

    if (!res_user.ok) {
      throw new Error(data_user.message || '사용자 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data_user || []
    });
  } catch (error) {
    log.info('GET /user ERROR ::: '+error);
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

/**
 * 사용자 생성
 * 1. client_credentials token 가져오기
 * 2. 사용자 생성
 * 3. 사용자 토큰 가져오기
 * 4. 사용자 uuid 가져오기
 * 5. 사용자가 선택한 role id 가져오기
 * 6. 사용자 role 등록
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /user');

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

    // 2. 사용자 생성
    const body = await request.json();
    const { username, password, firstName, lastName, email, telnum, role, type, company_id} = body;
    const attributes = {
      telnum,
      type,
      company_id
    }
    const submitData = {
      username,
      credentials: [{"type": "password", "value": password, "temporary": false}],
      firstName,
      lastName,
      email,
      enabled: true,
      emailVerified: false,
      attributes
    }

    const res_createuser = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
      body: JSON.stringify(submitData)
    });

    if(res_createuser && !res_createuser.ok) {
      const data_createuser = await res_createuser.json();
      log.info('POST /user DATA ::: '+JSON.stringify(data_createuser));
      if (data_createuser && !data_createuser.errors) throw new Error(data_createuser.errorMessage || data_createuser.error)
      if (data_createuser.errors) throw new Error(data_createuser.errors[0].errorMessage)
    }

    // 3. 사용자 토큰 가져오기
    const user_token = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: process.env.GRANT_TYPE,
      scope: process.env.SCOPE,
      username,
      password
    }

    const res_usertoken = await fetch(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(user_token).toString()
    });

    const data_usertoken = await res_usertoken.json();

    // 4. 사용자 uuid 가져오기
    const res_user = await fetch(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data_usertoken.access_token}`,
      },
    });

    const data_user = await res_user.json();

    // 5. role id 가져오기(api 오류로 인한 id 고정)
    // const res_role = await fetchWithAuth(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${role}`);
    // const data_role = await res_role.json();
    // console.log('role----------')
    // console.log(data_role)
    let role_id = ''
    if (role == 'Admin') {
      role_id = '53ef51a7-c479-41f8-9f29-131b7cb1c63c'
    } else {
      role_id = '8bf2d472-f8e1-4c97-9759-9c7fb6203763'
    }

    // 6. 사용자 role 등록
    // data_userRole값은 배열이어야함.
    const data_userRole = [{
      // id: data_role.id,
      id: role_id,
      name: role
    }]

    const res = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${data_user.sub}/role-mappings/realm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
      body: JSON.stringify(data_userRole)
    });

    if (res.status != 204) {
      const data = await res.json();
      throw new Error(data.errorMessage);
    }

    return NextResponse.json({
      success: true,
      status: 201,
      data: res
    });
  } catch (error) {
    log.info('POST /user ERROR ::: '+error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '사용자 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}