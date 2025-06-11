import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 사업 히스토리 목록 조회
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /business/'+params.id+'/history');
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history`);
    const business = await response.json();

    if (!response.ok) {
      throw new Error(business.message || '사업 히스토리 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: business || []
    });
  } catch (error) {
    log.info('GET /business/'+params.id+'/history ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '사업 히스토리 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 사업 히스토리 생성
 * @param request 
 * @returns 
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }) {
  try {
    log.info('API URL ::: POST /business/'+params.id+'/history');
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    //log.info('POST /business DATA ::: '+JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.message || '사업 히스토리생성에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    log.info('POST /business'+params.id+'/history ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '사업 히스토리 생성 중 오류가 발생했습니다.'
      },
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
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /business/'+params.id+'/history');
    const body = await request.json();
    const { id } = body;
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history/${id}`, {
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
    log.info('PUT /business'+params.id+'/history ERROR ::: '+error);
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
    log.info('API URL ::: DELETE /business/'+params.id+'/history');
    const { searchParams } = new URL(request.url);
    const history_id = searchParams.get('history_id');
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}/history/${history_id}`,{
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
    log.info('DELETE /business'+params.id+'/history ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 히스토리 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}