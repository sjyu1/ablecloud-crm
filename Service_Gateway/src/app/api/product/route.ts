import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 제품 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /product');
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const name = searchParams.get('name');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.PRODUCT_API_URL}/product`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (name) {
      apiUrl.searchParams.set('name', name);
    }

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();
    //log.info('GET /product DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '제품 조회에 실패했습니다.');
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
    log.info('GET /product ERROR ::: '+error);
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
 * 제품 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /product');
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/product`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    //log.info('POST /product DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '제품 생성에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /product ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '제품 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}