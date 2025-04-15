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
    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/product/${params.id}`);
    const product = await response.json();
    log.info('GET /product/'+params.id+' DATA ::: '+JSON.stringify(product));
    
    if (!product) {
      return NextResponse.json(
        { message: '제품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: product 
    });
  } catch (error) {
    log.info('GET /product/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '제품 조회 중 오류가 발생했습니다.' },
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

    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/product/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const product = await response.json();
    log.info('PUT /product/'+params.id+' DATA ::: '+JSON.stringify(product));
    
    // if (product === -1) {
    //   return NextResponse.json(
    //     { message: '제품을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // products[index] = { ...products[index], ...body };

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: product.message || '제품 수정 중 오류가 발생했습니다.'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: product.data 
    });
  } catch (error) {
    log.info('PUT /product/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '제품 수정 중 오류가 발생했습니다.' },
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
    const response = await fetchWithAuth(`${process.env.PRODUCT_API_URL}/product/${params.id}`,{
      method: 'DELETE',
    })

    // if (!response) {
    //   return NextResponse.json(
    //     { message: '제품을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // products = products.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '제품이 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /product/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '제품 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
