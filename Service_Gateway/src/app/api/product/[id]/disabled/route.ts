import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 제품 비활성화
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /product/'+params.id+'/disabled');
    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/product/${params.id}/disabled`, {
      method: 'PUT',
    });

    const product = await response.json();

    return NextResponse.json({ 
      status: 200,
      data: product.data 
    });
  } catch (error) {
    log.info('PUT /product/'+params.id+'/disabled ERROR ::: '+error);
    return NextResponse.json(
      { message: '제품 비활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}