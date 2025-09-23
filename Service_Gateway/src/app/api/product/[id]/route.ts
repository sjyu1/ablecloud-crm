import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 제품 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /product/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/product/${params.id}`);
    const product = await response.json();
    //log.info('GET /product/'+params.id+' DATA ::: '+JSON.stringify(product));
    
    if (!product) {
      throw new Error('제품을 찾을 수 없습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: product 
    });
  } catch (error) {
    log.info('GET /product/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '제품 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 제품 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /product/'+params.id);
    const body = await request.json();

    const { isoFilePath } = body;

    // checksum 값 가져오기
    /* fetch오류로 주석처리
    const md5Url = isoFilePath + '.md5';
    let md5Value = '';
    try {
      const response = await fetch(md5Url);
      if (response.ok) {
        md5Value = await response.text();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(errorMessage || 'checksum 값 가져오는 중 오류가 발생했습니다.');
    }

    const newBody = {
      ...body,
      checksum: md5Value,
    };
    */

    const response = await fetchWithAuth(`${process.env.API_URL}/product/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const product = await response.json();
    //log.info('PUT /product/'+params.id+' DATA ::: '+JSON.stringify(product));

    if (!response.ok) {
      throw new Error(product.message || '제품 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: product.data 
    });
  } catch (error) {
    log.info('PUT /product/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '제품 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 제품 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /product/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/product/${params.id}`,{
      method: 'DELETE',
    })

    return NextResponse.json({ 
      status: 200,
      message: '제품이 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /product/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '제품 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}