import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';

/**
 * 파트너 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');
    const role = searchParams.get('role');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.PARTNER_API_URL}/partner`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (name) {
      apiUrl.searchParams.set('name', name);
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

    // role 파라미터 존재하는 경우, 로그인한 사용자 회사 정보만 조회(role이 User여도 type이 vendor면 전체조회)
    let data_user_com = []
    let user_companytype
    let user_companyid
    if (role) {
      const data_userinfo = await userinfo();
      user_companytype = data_userinfo.attributes.type[0]
      user_companyid = data_userinfo.attributes.company_id[0]
    }

    for(var idx in data.partners) {
      if (role && user_companytype == 'partner' && user_companyid == data.partners[idx].id) {
        data_user_com.push(data.partners[idx])
      }
    }

    if (role && user_companytype == 'partner'){
      data.partners = data_user_com
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '파트너 조회에 실패했습니다.'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data.partners || [],
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
 * 파트너 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/partner`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '파트너 생성에 실패했습니다.'
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
        message: '파트너 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
