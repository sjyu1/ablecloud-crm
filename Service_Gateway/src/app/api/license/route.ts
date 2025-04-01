import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo } from '@/utils/userinfo';
import { cookies } from 'next/headers';
import { userinfo_id } from '@/utils/userinfo';

/**
 * 라이센스 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const productName = searchParams.get('productName');
    const role = searchParams.get('role');  // User 회사 정보만 조회

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.LICENSE_API_URL}/license`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (productName) {
      apiUrl.searchParams.set('productName', productName);
    }
    if (role) {
      const data_userinfo = await userinfo();
      if (data_userinfo.error)  throw new Error(data_userinfo.error);
      apiUrl.searchParams.set('company_id', data_userinfo.attributes.company_id[0]);
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

    // 라이센스 데이터에 발급자 정보 추가
    for(var idx in data.items) {
      const data_userinfo = await userinfo_id(data.items[idx].issued_id);
      if (data_userinfo.error)  continue;
      data.items[idx].issued_name = data_userinfo.username
      data.items[idx].issued_type = data_userinfo.attributes.type[0]
      data.items[idx].issued_company_id = data_userinfo.attributes.company_id[0]
  
      if (data.items[idx].issued_type == 'vendor') {
        data.items[idx].issued_company = 'ABLECLOUD'
      } else {
        const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data.items[idx].issued_type}/${data.items[idx].issued_company_id}`);
        const company = await response.json();
        data.items[idx].issued_company = company.name
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '라이센스 조회에 실패했습니다.'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data.items || [],
      pagination: {
        currentPage: page,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 라이센스 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    const username = (await cookies()).get('username')?.value;
    const role = (await cookies()).get('role')?.value;
    let company_id;
    let issued_id;
    
    // company_id 조회한 후 라이센스등록
    // if (role == 'User'){
    const data_userinfo = await userinfo();
    if (data_userinfo.error)  throw new Error(data_userinfo.error);
    issued_id = data_userinfo.id;
    company_id = data_userinfo.attributes.company_id[0];
    // }
    
    const body = await request.json();
    const submitData = {
      ...body,
      issued_user: username,
      status: role == 'Admin'? 'active' : 'inactive',
      company_id: role == 'User'? company_id : null,
      issued_id: issued_id
    }

    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license`, {
      method: 'POST',
      body: JSON.stringify(submitData),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '라이센스 생성에 실패했습니다.'
        },
        { status: response.status }
      );
    }

    //라이센스 등록 후 사업에 license_id 등록
    const submitData_business = {
      license_id: data.id,
    }

    const response_business = await fetchWithAuth(`${process.env.BUSINESS_API_URL}/business/${data.business_id}/registerLicense`, {
      method: 'PUT',
      body: JSON.stringify(submitData_business),
    });

    if (!response_business.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '사업에 라이센스 아이드 등록을 실패했습니다.'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: '라이센스 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
