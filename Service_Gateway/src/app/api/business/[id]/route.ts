import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';

/**
 * 사업 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /business/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}`);
    const business = await response.json();
    //('GET /business/'+params.id+' DATA ::: '+JSON.stringify(business));

    // 사업 데이터에 사업담당자 정보 추가
    // const data_userinfo = await userinfo_id(business.manager_id);
    // if (!data_userinfo.error) {
    //   business.manager_name = data_userinfo.username
    //   business.manager_type = data_userinfo.attributes.type[0]
    //   business.manager_company_id = data_userinfo.attributes.company_id[0]
    // }

    // if (business.manager_type == 'vendor') {
    //   business.manager_company = 'ABLECLOUD'
    // } else {
    //   const response = await fetchWithAuth(`${process.env.API_URL}/${business.manager_type}/${business.manager_company_id}`);
    //   const company = await response.json();
    //   business.manager_company = company.name
    // }

    // product_id를 이용해 제품/제품버전 가져오기
    // const response_product = await fetchWithAuth(`${process.env.API_URL}/product/${business.product_id}`);
    // const product = await response_product.json();
    // business.product_name = product.name
    // business.product_version = product.version

    if (!business) {
      return NextResponse.json(
        { message: '사업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: business
    });
  } catch (error) {
    log.info('GET /business/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 사업 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /business/'+params.id);
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}`, {
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
      throw new Error(business.message || '사업 수정 중 오류가 발생했습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: business.data 
    });
  } catch (error) {
    log.info('PUT /business/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 사업 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /business/'+params.id);
    const response = await fetchWithAuth(`${process.env.API_URL}/business/${params.id}`,{
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
      message: '사업이 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /business/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '사업 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}