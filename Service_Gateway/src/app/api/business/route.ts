import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 사업 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /business');
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');
    const manager_company = searchParams.get('manager_company');
    const customer_name = searchParams.get('customer_name');
    const status = searchParams.get('status');
    const available = searchParams.get('available');  // 라이선스 없는 사업 조회
    const customer_id = searchParams.get('customer_id');  // 기술지원메뉴 등록에서 고객 선택시 조회
    const role = searchParams.get('role');  // User 회사 정보만 조회
    const order = searchParams.get('order');  // 이름순 정렬

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.API_URL}/business`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    // 필터 파라미터 적용
    if (name) apiUrl.searchParams.set('name', name);
    if (manager_company) apiUrl.searchParams.set('manager_company', manager_company);
    if (customer_name) apiUrl.searchParams.set('customer_name', customer_name);
    if (status) apiUrl.searchParams.set('status', status);
    if (available) apiUrl.searchParams.set('available', available);
    if (customer_id) apiUrl.searchParams.set('customer_id', customer_id);
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
    //log.info('GET /business DATA ::: '+JSON.stringify(data));

    // role 파라미터 존재하는 경우, 로그인한 사용자 회사 정보만 조회(role이 User여도 type이 vendor면 전체조회)
    // let data_user_com = []
    // let user_companytype
    // if (role) {
    //   const data_userinfo = await userinfo();
    //   if (!data_userinfo.error) {
    //     user_companytype = data_userinfo.attributes.type[0]
    //   }
    // }
    
    // // 사업 데이터에 사업담당자 정보 추가
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

    //   // product_id를 이용해 제품/제품버전 가져오기
    //   // const response = await fetchWithAuth(`${process.env.API_URL}/product/${data.items[idx].product_id}`);
    //   // const product = await response.json();
    //   // data.items[idx].product_name = product.name
    //   // data.items[idx].product_version = product.version
    // }

    // if (role && user_companytype !== 'vendor'){
    //   data.items = data_user_com
    // }

    if (!response.ok) {
      throw new Error(data.message || '사업 조회에 실패했습니다.');
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
    log.info('GET /business ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '사업 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 사업 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /business');
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/business`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    //log.info('POST /business DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '사업 생성에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /business ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '사업 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}