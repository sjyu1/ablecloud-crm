import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { encryptContent, decryptContent } from '@/utils/encryption';
import log from '@/utils/logger';

/**
 * 라이선스 다운로드
 * @param request 
 * @returns 
 */ 
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /license/'+params.id+'/download');

    const response = await fetchWithAuth(`${process.env.API_URL}/license/${params.id}`);

    const license = await response.json();

    //log.info('GET /license/'+params.id+'/download DATA ::: '+JSON.stringify(license));

    // 라이선스 파일 내용 생성
    const licenseContent = JSON.stringify(license, null, 2);
    const parsedLicense = JSON.parse(licenseContent);
    const data = parsedLicense.data;
    const license_str = JSON.stringify(data, null, 2);

    // 데이터 암호화
    const licenseContent_enc = await encryptContent(license_str);
    
    // 파일 이름 설정
    // const filename = `license_${license_key}.lic`;

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    // headers.set('Content-Disposition', `attachment; filename=${filename}`);

    // 복호화 데이터
    // log.info('---------------license data')
    // log.info(await decryptContent(''))

    return new NextResponse(licenseContent_enc, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    log.info('PUT /license/'+params.id+'/download ERROR::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '라이선스 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}