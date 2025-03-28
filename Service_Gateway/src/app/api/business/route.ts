import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo_id } from '@/utils/userinfo';

/**
 * 사업 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');
    const available = searchParams.get('available');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.BUSINESS_API_URL}/business`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (name) {
      apiUrl.searchParams.set('name', name);
    }
    if (available) {
      apiUrl.searchParams.set('available', available);
    }
    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

    // 사업 데이터에 사업담당자 정보 추가
    for(var idx in data.items) {
      const data_userinfo = await userinfo_id(data.items[idx].manager_id);
      data.items[idx].manager_name = data_userinfo.username
      data.items[idx].manager_type = data_userinfo.attributes.type[0]
      data.items[idx].manager_company_id = data_userinfo.attributes.company_id[0]
  
      if (data.items[idx].manager_type == 'vendor') {
        data.items[idx].manager_company = 'ABLECLOUD'
      } else {
        const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data.items[idx].manager_type}/${data.items[idx].manager_company_id}`);
        const company = await response.json();
        data.items[idx].manager_company = company.name
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '사업 조회에 실패했습니다.'
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
 * 사업 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.BUSINESS_API_URL}/business`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '사업 생성에 실패했습니다.'
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
        message: '사업 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
