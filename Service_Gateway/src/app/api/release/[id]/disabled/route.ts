import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 릴리즈노트 비활성화
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /release/'+params.id+'/disabled');
    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/release/${params.id}/disabled`, {
      method: 'PUT',
    });

    const release = await response.json();

    return NextResponse.json({ 
      status: 200,
      data: release.data 
    });
  } catch (error) {
    log.info('PUT /release/'+params.id+'/disabled ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '릴리즈노트 비활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}