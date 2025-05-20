import { NextResponse } from 'next/server';
import { fetchWithAuth, fetchWithAuthValid } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 사용자 목록 조회
 * 1. client_credentials token 가져오기
 * 2. 사용자 목록 조회
 * 3. 사용자 데이터에 값 추가
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /user/forManager');
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    const type = searchParams.get('type');  //vendor, partner, customer

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
    let data_user_com = []
    for(var idx in data_user){
      // json 항목 담기(attributes: { type: [ 'vendor' ], telnum: [ '02-000-0000' ] })
      data_user[idx].type = data_user[idx].attributes.type
      data_user[idx].telnum = data_user[idx].attributes.telnum
      data_user[idx].company_id = data_user[idx].attributes.company_id

      // 파트너/고객 메뉴에서 담당자 목록 조회 (파트너/고객 id를 통해 회사이름 가져오기)
      if (type !== 'vendor' && type == data_user[idx].type && company_id == data_user[idx].company_id) {
        const response = await fetchWithAuth(`${process.env.API_URL}/${type}/${data_user[idx].company_id}`);
        const company = await response.json();
        data_user[idx].company = company.name

        data_user_com.push(data_user[idx])
      } else {
        data_user[idx].company = 'ABLECLOUD'
      }
    }

    if (company_id) {
      data_user = data_user_com
    }

    //log.info('GET /user/forManager DATA ::: '+JSON.stringify(data_user));

    if (!res_user.ok) {
      throw new Error(data_user.message || '사용자 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data_user || []
    });
  } catch (error) {
    log.info('GET /user/forManager ERROR ::: '+error);
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