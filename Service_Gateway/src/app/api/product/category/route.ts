import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 제품 카테고리 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /product/category');
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.API_URL}/product/category`);
    // 필터 파라미터 적용
    if (name) apiUrl.searchParams.set('name', name);

    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();
    //log.info('GET /product DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '제품 카테고리 조회에 실패했습니다.');
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
    log.info('GET /product/category ERROR ::: '+error);
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