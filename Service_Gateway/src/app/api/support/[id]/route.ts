import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 기술지원 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /support/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/support/${params.id}`);
    const support = await response.json();
    //('GET /support/'+params.id+' DATA ::: '+JSON.stringify(support));

    if (!support) {
      return NextResponse.json(
        { message: '기술지원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: support
    });
  } catch (error) {
    log.info('GET /support/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '기술지원 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 기술지원 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /support/'+params.id);
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/support/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const support = await response.json();
    //log.info('PUT /support/'+params.id+' DATA ::: '+JSON.stringify(support));
    // if (support === -1) {
    //   return NextResponse.json(
    //     { message: '기술지원을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // support[index] = { ...support[index], ...body };

    if (!response.ok) {
      throw new Error(support.message || '기술지원 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: support.data 
    });
  } catch (error) {
    log.info('PUT /support/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '기술지원 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 기술지원 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /support/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/support/${params.id}`,{
      method: 'DELETE',
    })

    // if (!response) {
    //   return NextResponse.json(
    //     { message: '기술지원을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // bussines = bussines.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '기술지원이 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /support/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '기술지원 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}