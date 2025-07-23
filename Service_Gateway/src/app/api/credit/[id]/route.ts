import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 크레딧 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /credit/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/credit/${params.id}`);
    const credit = await response.json();
    //('GET /credit/'+params.id+' DATA ::: '+JSON.stringify(credit));

    if (!credit) {
      return NextResponse.json(
        { message: '크레딧을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: credit
    });
  } catch (error) {
    log.info('GET /credit/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '크레딧 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 크레딧 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /credit/'+params.id);
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/credit/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const credit = await response.json();
    //log.info('PUT /credit/'+params.id+' DATA ::: '+JSON.stringify(credit));
    // if (credit === -1) {
    //   return NextResponse.json(
    //     { message: '크레딧을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // credit[index] = { ...credit[index], ...body };

    if (!response.ok) {
      throw new Error(credit.message || '크레딧 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: credit.data 
    });
  } catch (error) {
    log.info('PUT /credit/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '크레딧 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 크레딧 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /credit/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/credit/${params.id}`,{
      method: 'DELETE',
    })

    // if (!response) {
    //   return NextResponse.json(
    //     { message: '크레딧을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // bussines = bussines.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '크레딧이 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /credit/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '크레딧 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}