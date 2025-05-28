import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 릴리즈노트 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /release/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/release/${params.id}`);
    const release = await response.json();
    //log.info('GET /release/'+params.id+' DATA ::: '+JSON.stringify(release));
    
    if (!release) {
      throw new Error('릴리즈노트를 찾을 수 없습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: release 
    });
  } catch (error) {
    log.info('GET /release/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '릴리즈노트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 릴리즈노트 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /release/'+params.id);
    const body = await request.json();

    const response = await fetchWithAuth(`${process.env.API_URL}/release/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const release = await response.json();
    //log.info('PUT /release/'+params.id+' DATA ::: '+JSON.stringify(release));

    if (!response.ok) {
      throw new Error(release.message || '릴리즈노트 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: release.data 
    });
  } catch (error) {
    log.info('PUT /release/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '릴리즈노트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 릴리즈노트 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /release/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/release/${params.id}`,{
      method: 'DELETE',
    })

    return NextResponse.json({ 
      status: 200,
      message: '릴리즈노트가 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /release/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '릴리즈노트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}