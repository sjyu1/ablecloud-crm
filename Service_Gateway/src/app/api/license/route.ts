import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo } from '@/utils/userinfo';
import { cookies } from 'next/headers';

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
    const role = searchParams.get('role');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.LICENSE_API_URL}/license`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (productName) {
      apiUrl.searchParams.set('productName', productName);
    } else if (role) {
      const data_userinfo = await userinfo();
      apiUrl.searchParams.set('company_id', data_userinfo.attributes.company_id[0]);
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

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
    
    // company_id 조회한 후 라이센스등록
    if (role == 'User'){
      const data_userinfo = await userinfo();
      company_id = data_userinfo.attributes.company_id[0];
    }
    
    const body = await request.json();
    const submitData = {
      ...body,
      issued_user: username,
      status: role == 'Admin'? 'active' : 'inactive',
      company_id: role == 'User'? company_id : ''
    }

    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license`, {
      method: 'POST',
      body: JSON.stringify(submitData),
    });

    // console.log(response)
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
