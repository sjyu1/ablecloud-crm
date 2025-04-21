import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 파트너 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /partner/'+params.id);
    const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/partner/${params.id}`);
    const partner = await response.json();
    //log.info('GET /partner/'+params.id+' DATA ::: '+JSON.stringify(partner));
    
    if (!partner) {
      throw new Error('파트너를 찾을 수 없습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: partner 
    });
  } catch (error) {
    log.info('GET /partner/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '파트너 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 파트너 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /partner/'+params.id);
    const body = await request.json();

    const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/partner/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const partner = await response.json();
    //log.info('PUT /partner/'+params.id+' DATA ::: '+JSON.stringify(partner));

    if (!response.ok) {
      throw new Error(partner.message || '파트너 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: partner.data 
    });
  } catch (error) {
    log.info('PUT /partner/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '파트너 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 파트너 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /partner/'+params.id);
    const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/partner/${params.id}`,{
      method: 'DELETE',
    })

    return NextResponse.json({ 
      status: 200,
      message: '파트너가 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /partner/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '파트너 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
