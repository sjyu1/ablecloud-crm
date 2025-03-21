import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';

/**
 * 파트너 목록 조회
 * @returns 
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const productId = searchParams.get('productId');

    // 페이징 파라미터를 포함한 API 호출
    const apiUrl = new URL(`${process.env.PARTNER_API_URL}/partner`);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('limit', limit.toString());
    if (productId) {
      apiUrl.searchParams.set('productId', productId);
    }
    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();

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
