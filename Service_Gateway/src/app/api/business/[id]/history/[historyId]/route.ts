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