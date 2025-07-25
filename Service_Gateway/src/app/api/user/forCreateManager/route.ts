import { NextResponse } from 'next/server';
import { fetchWithAuth, fetchWithAuthValid } from '@/utils/api';
import { userinfo } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 사용자 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /user/forCreateManager');
    const { searchParams } = new URL(request.url);
    // const page = Number(searchParams.get('page')) || 1;
    // const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');
    const role = searchParams.get('role');  // User 회사 정보만 조회

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.API_URL}/user/forCreateManager`);
    // apiUrl.searchParams.set('page', page.toString());
    // apiUrl.searchParams.set('limit', limit.toString());

    // 필터 파라미터 적용
    if (name) apiUrl.searchParams.set('name', name);
    // 유저 역할에 따라 회사 정보 추가(파트너일 경우)
    if (role) {
      const data_userinfo = await userinfo();
      if (!data_userinfo.error) {
        const user_companytype = data_userinfo.attributes.type[0]
        const user_companyid = data_userinfo.attributes.company_id[0]

        if (user_companytype !== 'vendor') {
          apiUrl.searchParams.set('type', 'partner');
          apiUrl.searchParams.set('company_id', user_companyid);
        }
      }
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '고객 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data.items || [],
      pagination: {
        currentPage: data.currentPage,
        itemsPerPage: data.itemsPerPage,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0
      }
    });


    // const { searchParams } = new URL(request.url);
    // const role = searchParams.get('role');

    // // 1. client_credentials token 가져오기
    // const submitData_token = {
    //   client_id: process.env.CLIENT_ID,
    //   client_secret: process.env.CLIENT_SECRET,
    //   scope: process.env.SCOPE,
    //   grant_type: 'client_credentials',
    // }

    // const res_token = await fetchWithAuthValid(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams(submitData_token).toString()
    // });

    // const client_token = await res_token.json();

    // // 2. 사용자 목록 조회
    // const res_user = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${client_token.access_token}`,
    //   },
    // });

    // let data_user = await res_user.json();

    // // 3. 사용자 데이터에 값 추가
    // let data_user_manager = []
    // let data_user_manager_user = []
    // for(var idx in data_user){
    //   if (data_user[idx].attributes.type == 'customer'){
    //     continue;
    //   } else {
    //     if (role) { //role 파라미터가 존재하는 경우, user type 조회(role이 user여도 type이 vendor일 경우 전체조회)
    //       const data_userinfo = await userinfo();
    //       if (data_userinfo.error)  continue;
    //       const user_companytype = data_userinfo.attributes.type[0]
    //       const user_company_id = data_userinfo.attributes.company_id[0]
    //       if (user_companytype == data_user[idx].attributes.type && user_company_id == data_user[idx].attributes.company_id) {
    //         data_user_manager_user.push(data_user[idx])
    //       }
    //     } else {
    //       data_user_manager.push(data_user[idx])
    //     }
    //   }

    //   // json 항목 담기(attributes: { type: [ 'vendor' ], telnum: [ '02-000-0000' ] })
    //   data_user[idx].type = data_user[idx].attributes.type
    //   data_user[idx].telnum = data_user[idx].attributes.telnum
    //   data_user[idx].company_id = data_user[idx].attributes.company_id

    //   const res = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${data_user[idx].id}/role-mappings/realm`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${client_token.access_token}`,
    //     }
    //   });

    //   // 파트너/고객 메뉴에서 담당자 목록 조회 (파트너/고객 id를 통해 회사이름 가져오기)
    //   if (data_user[idx].type[0] !== 'vendor') {
    //     const response = await fetchWithAuth(`${process.env.API_URL}/${data_user[idx].type[0]}/${data_user[idx].company_id[0]}`);
    //     const company = await response.json();
    //     data_user[idx].company = company.name
    //   } else {
    //     data_user[idx].company = 'ABLECLOUD'
    //   }
    // }

    // if (role) {
    //   data_user = data_user_manager_user
    // } else {
    //   data_user = data_user_manager
    // }

    // //log.info('GET /user/forCreateManager DATA ::: '+JSON.stringify(data_user));

    // if (!res_user.ok) {
    //   throw new Error(data_user.message || '사용자 조회에 실패했습니다.');
    // }

    // return NextResponse.json({ 
    //   success: true,
    //   status: 200,
    //   data: data_user || []
    // });
  } catch (error) {
    log.info('GET /user/forCreateManager ERROR ::: '+error);
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