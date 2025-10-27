import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 고객 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /customer');
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');
    const manager_company = searchParams.get('manager_company');
    const role = searchParams.get('role');  // User 회사 정보만 조회
    const order = searchParams.get('order');  // 이름순 정렬

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.API_URL}/customer`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    // 필터 파라미터 적용
    if (name) apiUrl.searchParams.set('name', name);
    if (manager_company) apiUrl.searchParams.set('manager_company', manager_company);
    if (order) apiUrl.searchParams.set('order', order);
    // 유저 역할에 따라 회사 정보 추가(파트너일 경우)
    if (role) {
      const data_userinfo = await userinfo();
      if (!data_userinfo.error && data_userinfo.attributes.type[0] == 'partner') {
        apiUrl.searchParams.set('company_id', data_userinfo.attributes.company_id[0]);
      }
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();
    //log.info('GET /customer DATA ::: '+JSON.stringify(data));

    // // 고객 데이터에 사업담당자 정보 추가
    // for(var idx in data.items) {
    //   const data_userinfo = await userinfo_id(data.items[idx].manager_id);
    //   if (data_userinfo.error)  continue;
    //   data.items[idx].manager_name = data_userinfo.username
    //   data.items[idx].manager_type = data_userinfo.attributes.type[0]
    //   data.items[idx].manager_company_id = data_userinfo.attributes.company_id[0]

    //   if (data.items[idx].manager_type == 'vendor') {
    //     data.items[idx].manager_company = 'ABLECLOUD'
    //   } else {
    //     const response = await fetchWithAuth(`${process.env.API_URL}/${data.items[idx].manager_type}/${data.items[idx].manager_company_id}`);
    //     const company = await response.json();
    //     data.items[idx].manager_company = company.name
    //   }

    //   if (role && user_companytype !== 'vendor'){
    //     const data_user = await userinfo();
    //     if (data_user.attributes.type[0] == data.items[idx].manager_type && data_user.attributes.company_id[0] == data.items[idx].manager_company_id){
    //       data_user_com.push(data.items[idx])
    //     }
    //   }
    // }

    // if (role && user_companytype !== 'vendor'){
    //   data.items = data_user_com
    // }

    if (!response.ok) {
      throw new Error(data.message || '고객 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data.data || [],
      pagination: {
        currentPage: data.data.currentPage,
        itemsPerPage: data.data.itemsPerPage,
        totalPages: data.data.totalPages || 1,
        totalItems: data.data.totalItems || 0
      }
    });
  } catch (error) {
    log.info('GET /customer ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 고객 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /customer');
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/customer`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    //log.info('POST /customer DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '고객 생성에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /customer ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '고객 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}