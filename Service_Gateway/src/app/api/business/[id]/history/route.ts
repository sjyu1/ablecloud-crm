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