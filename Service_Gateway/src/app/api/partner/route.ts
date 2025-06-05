import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 파트너 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /partner');
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');
    const role = searchParams.get('role');
    const level = searchParams.get('level');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.API_URL}/partner`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (name) {
      apiUrl.searchParams.set('name', name);
    }
    if (level) {
      apiUrl.searchParams.set('level', level);
    }

    // role 파라미터 존재하는 경우, 로그인한 사용자 회사 정보만 조회(role이 User여도 type이 vendor면 전체조회)
    if (role) {
      const data_userinfo = await userinfo();
      if (!data_userinfo.error) {
        apiUrl.searchParams.set('id', data_userinfo.attributes.company_id[0]);
      }
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '파트너 조회에 실패했습니다.');
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
    log.info('GET /partner ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '파트너 조회에 실패했습니다.'
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
    log.info('API URL ::: POST /partner');
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/partner`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    //log.info('POST /partner DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '파트너 생성에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /partner ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '파트너 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}