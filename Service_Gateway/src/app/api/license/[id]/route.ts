import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 라이센스 상세 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /license/'+params.id);
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`);
    const data = await response.json();
    log.info('GET /license/'+params.id+' DATA ::: '+JSON.stringify(data));

    // 라이센스 데이터에 발급자 정보 추가
    const data_userinfo = await userinfo_id(data.issued_id);
    if (!data_userinfo.error) {
      data.issued_name = data_userinfo.username
      data.issued_type = data_userinfo.attributes.type[0]
      data.issued_company_id = data_userinfo.attributes.company_id[0]
    }

    if (data.issued_type == 'vendor') {
      data.issued_company = 'ABLECLOUD'
    } else {
      const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data.issued_type}/${data.issued_company_id}`);
      const company = await response.json();
      log.info('GET /license/'+params.id+' company DATA ::: '+JSON.stringify(company));
      data.issued_company = company.name
    }

    if (!data) {
      throw new Error('라이센스를 찾을 수 없습니다.');
    }

    return NextResponse.json({ 
      status: 200,
      data: data 
    });
  } catch (error) {
    log.info('GET /license/'+params.id+' ERROR ::: '+error);
    return NextResponse.json(
      { message: '라이센스 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 라이센스 수정
 * @param request 
 * @param params 
 * @returns 
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: PUT /license/'+params.id);
    const body = await request.json();
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const license = await response.json();
    log.info('PUT /license/'+params.id+' DATA ::: '+JSON.stringify(license));

    return NextResponse.json({ 
      status: 200,
      data: license.data 
    });
  } catch (error) {
    log.info('PUT /license/'+params.id+' ERROR::: '+error);
    return NextResponse.json(
      { message: '라이센스 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 라이센스 삭제
 * @param request 
 * @param params 
 * @returns 
 */ 
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: DELETE /license/'+params.id);
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get('business_id');

    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}?business_id=${business_id}`,{
      method: 'DELETE',
    })

    return NextResponse.json({ 
      status: 200,
      message: '라이센스가 삭제되었습니다.' 
    });
  } catch (error) {
    log.info('DELETE /license/'+params.id+' ERROR::: '+error);
    return NextResponse.json(
      { message: '라이센스 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}