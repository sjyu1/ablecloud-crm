import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 제품 활성화
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /product/'+params.id+'/enabled');
    const response = await fetchWithAuth(`${process.env.API_URL}/product/${params.id}/enabled`, {
      method: 'PUT',
    });

    const product = await response.json();

    return NextResponse.json({ 
      status: 200,
      data: product.data 
    });
  } catch (error) {
    log.info('PUT /product/'+params.id+'/enabled ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '제품 활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}