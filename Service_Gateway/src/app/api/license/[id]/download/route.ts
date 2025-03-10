import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import { encryptContent } from '@/utils/encryption';

/**
 * 라이센스 다운로드
 * @param request 
 * @returns 
 */ 
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`);

    const license = await response.json();
    // 라이센스 파일 내용 생성
    const licenseContent = JSON.stringify(license, null, 2);

    // 데이터 암호화
    const licenseContent_enc = await encryptContent(licenseContent);
    
    // 파일 이름 설정
    // const filename = `license_${license_key}.lic`;

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    // headers.set('Content-Disposition', `attachment; filename=${filename}`);

    return new NextResponse(licenseContent_enc, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('License download error:', error);
    return NextResponse.json(
      { message: '라이센스 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
