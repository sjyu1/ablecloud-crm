import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 공지사항 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /notice/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/notice/${params.id}`);
    const notice = await response.json();
    //('GET /notice/'+params.id+' DATA ::: '+JSON.stringify(notice));

    if (!notice) {
      return NextResponse.json(
        { message: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: notice
    });
  } catch (error) {
    log.info('GET /notice/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '공지사항 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 공지사항 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /notice/'+params.id);
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/notice/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const notice = await response.json();
    //log.info('PUT /notice/'+params.id+' DATA ::: '+JSON.stringify(notice));
    // if (notice === -1) {
    //   return NextResponse.json(
    //     { message: '공지사항을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // notice[index] = { ...notice[index], ...body };

    if (!response.ok) {
      throw new Error(notice.message || '공지사항 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: notice.data 
    });
  } catch (error) {
    log.info('PUT /notice/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '공지사항 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 공지사항 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /notice/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/notice/${params.id}`,{
      method: 'DELETE',
    })

    // if (!response) {
    //   return NextResponse.json(
    //     { message: '공지사항을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // bussines = bussines.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '공지사항이 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /notice/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '공지사항 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}