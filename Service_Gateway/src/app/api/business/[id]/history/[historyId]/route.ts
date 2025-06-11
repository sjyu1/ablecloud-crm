import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 사업 히스토리 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string, historyId: string } }
) {
  try {
    log.info('API URL ::: GET /business/'+params.id+'/history/'+params.historyId);
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history/${params.historyId}`);
    const business = await response.json();

    if (!business) {
      return NextResponse.json(
        { message: '사업 히스토리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: business
    });
  } catch (error) {
    log.info('GET /business/'+params.id+'/history/'+params.historyId);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 히스토리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 사업 히스토리 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string, historyId: string } }
) {
  try {
    log.info('API URL ::: PUT /business/'+params.id+'/history/'+params.historyId);
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history/${params.historyId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const business = await response.json();
    //log.info('PUT /business/'+params.id+' DATA ::: '+JSON.stringify(business));
    // if (business === -1) {
    //   return NextResponse.json(
    //     { message: '사업을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // business[index] = { ...business[index], ...body };

    if (!response.ok) {
      throw new Error(business.message || '사업 히스토리 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: business.data 
    });
  } catch (error) {
    log.info('PUT /business'+params.id+'/history/'+params.historyId+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 히스토리 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 사업 히스토리 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, historyId: string } }
) {
  try {
    log.info('API URL ::: DELETE /business/'+params.id+'/history/'+params.historyId);
    const { searchParams } = new URL(request.url);
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history/${params.historyId}`,{
      method: 'DELETE',
    })

    // if (!response) {
    //   return NextResponse.json(
    //     { message: '사업을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // bussines = bussines.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '사업 히스토리가 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /business'+params.id+'/history/'+params.historyId+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 히스토리 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}