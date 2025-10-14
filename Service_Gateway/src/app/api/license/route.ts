import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo } from '@/utils/userinfo';
import { cookies } from 'next/headers';
import { userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 라이선스 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /license');
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const business_name = searchParams.get('business_name');
    const license_key = searchParams.get('license_key');
    const status = searchParams.get('status');
    const role = searchParams.get('role');  // User 회사 정보만 조회
    const trial = searchParams.get('trial');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.API_URL}/license`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    // 필터 파라미터 적용
    if (business_name) apiUrl.searchParams.set('business_name', business_name);
    if (license_key) apiUrl.searchParams.set('license_key', license_key);
    if (status) apiUrl.searchParams.set('status', status);
    if (trial) apiUrl.searchParams.set('trial', trial);
    // 유저 역할에 따라 회사 정보 추가(파트너일 경우)
    if (role) {
      const data_userinfo = await userinfo();
      if (!data_userinfo.error && data_userinfo.attributes.type[0] == 'partner') {
        apiUrl.searchParams.set('company_id', data_userinfo.attributes.company_id[0]);
      }
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();
    //log.info('GET /license DATA ::: '+JSON.stringify(data));

    // 라이선스 데이터에 발급자 정보 추가
    // for(var idx in data.items) {
    //   const data_userinfo = await userinfo_id(data.items[idx].issued_id);
    //   if (data_userinfo.error)  continue;
    //   data.items[idx].issued_name = data_userinfo.username
    //   data.items[idx].issued_type = data_userinfo.attributes.type[0]
    //   data.items[idx].issued_company_id = data_userinfo.attributes.company_id[0]
  
    //   if (data.items[idx].issued_type == 'vendor') {
    //     data.items[idx].issued_company = 'ABLECLOUD'
    //   } else {
    //     const response = await fetchWithAuth(`${process.env.API_URL}/${data.items[idx].issued_type}/${data.items[idx].issued_company_id}`);
    //     const company = await response.json();
    //     data.items[idx].issued_company = company.name
    //   }
    // }

    if (!response.ok) {
      throw new Error(data.message || '라이선스 조회에 실패했습니다.');
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
  } catch (error) {
    log.info('GET /license ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '라이선스 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 라이선스 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /license');
    const username = (await cookies()).get('username')?.value;
    const issued_id = (await cookies()).get('userId')?.value;
    // const company_id = (await cookies()).get('companyId')?.value;
    const role = (await cookies()).get('role')?.value;
    
    const body = await request.json();
    const submitData = {
      ...body,
      issued_user: username,
      status: role == 'Admin'? 'active' : 'inactive',
      // company_id: role == 'User'? company_id : null,
      issued_id: issued_id
    }

    const response = await fetchWithAuth(`${process.env.API_URL}/license`, {
      method: 'POST',
      body: JSON.stringify(submitData),
    });

    const data = await response.json();
    //log.info('POST /license DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '라이선스 생성에 실패했습니다.');
    }

    //라이선스 등록 후 사업에 license_id 등록
    const submitData_business = {
      license_id: data.id,
    }

    const response_business = await fetchWithAuth(`${process.env.API_URL}/business/${data.business_id}/registerLicense`, {
      method: 'PUT',
      body: JSON.stringify(submitData_business),
    });

    const data_business = await response_business.json();
    //log.info('POST /license DATA ::: '+JSON.stringify(response_business));

    if (!response_business.ok) {
      throw new Error(data_business.message || '사업에 라이선스 등록을 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /license ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '라이선스 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}