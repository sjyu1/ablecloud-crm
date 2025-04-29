import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 릴리즈노트 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /release');
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const version = searchParams.get('version');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.PRODUCT_API_URL}/release`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (version) {
      apiUrl.searchParams.set('version', version);
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();
    //log.info('GET /release DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '릴리즈노트 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data.data || [],
      pagination: {
        currentPage: page,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    log.info('GET /release ERROR ::: '+error);
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
 * 릴리즈노트 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /release');
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/release`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    //log.info('POST /release DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '릴리즈노트 생성에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /release ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '릴리즈노트 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}