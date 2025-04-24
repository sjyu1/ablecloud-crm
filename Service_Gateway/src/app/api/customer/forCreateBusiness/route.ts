import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 고객 목록 조회(사업 등록시)
 * @returns 
 */
export async function GET(request: Request) {
  try {
    log.info('API URL ::: GET /customer');
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');  // User 회사 정보만 조회

    const apiUrl = new URL(`${process.env.PARTNER_API_URL}/customer`);
    const response = await fetchWithAuth(apiUrl.toString());
    const data = await response.json();
    //log.info('GET /customer DATA ::: '+JSON.stringify(data));

    // role 파라미터가 존재하는경우, 로그인한 파트너의 정보만 조회(role이 user여도 type이 vendor일 경우 전체조회)
    let data_user_com = []
    let user_companytype
    if (role) {
      const data_userinfo = await userinfo();
      if (!data_userinfo.error) {
        user_companytype = data_userinfo.attributes.type[0]
      }
    }

    // 고객 데이터에 사업담당자 정보 추가
    for(var idx in data.data) {
      const data_userinfo = await userinfo_id(data.data[idx].manager_id);
      if (data_userinfo.error)  continue;
      data.data[idx].manager_name = data_userinfo.username
      data.data[idx].manager_type = data_userinfo.attributes.type[0]
      data.data[idx].manager_company_id = data_userinfo.attributes.company_id[0]

      if (data.data[idx].manager_type == 'vendor') {
        data.data[idx].manager_company = 'ABLECLOUD'
      } else {
        const response = await fetchWithAuth(`${process.env.PARTNER_API_URL}/${data.data[idx].manager_type}/${data.data[idx].manager_company_id}`);
        const company = await response.json();
        data.data[idx].manager_company = company.name
      }

      if (role && user_companytype !== 'vendor'){
        const data_user = await userinfo();
        if (data_user.attributes.type[0] == data.data[idx].manager_type && data_user.attributes.company_id[0] == data.data[idx].manager_company_id){
          data_user_com.push(data.data[idx])
        }
      }
    }

    if (role && user_companytype !== 'vendor'){
      data.data = data_user_com
    }

    if (!response.ok) {
      throw new Error(data.message || '고객 조회에 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: data.data || []
    });
  } catch (error) {
    log.info('GET /customer ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}