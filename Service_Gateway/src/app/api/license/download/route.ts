import { NextResponse } from 'next/server';
import { config } from '@/config';
import { fetchWithAuth } from '@/utils/api';

/**
 * 라이센스 다운로드
 * @param request 
 * @returns 
 */ 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { license_key } = body;

    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`,{
      method: 'GET',
    })

    const license = await response.json();

    // 라이센스 파일 내용 생성
    const licenseContent = JSON.stringify(license.data, null, 2);

    // 파일 이름 설정
    const filename = `license_${license_key}.lic`;

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename=${filename}`);

    return new NextResponse(licenseContent, {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const license_key = searchParams.get('key');

    if (!license_key) {
      return NextResponse.json(
        { message: '라이센스 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // 라이센스 키 데이터 생성 (실제로는 DB에서 조회)
    const licenseData = {
      license_key,
      issued_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1년
      product_info: {
        name: "Product Name",
        version: "1.0.0"
      },
      restrictions: {
        max_users: 10,
        features: ["feature1", "feature2", "feature3"]
      }
    };

    // 라이센스 파일 내용 생성
    const licenseContent = JSON.stringify(licenseData, null, 2);

    // 파일 이름 설정
    const filename = `license_${license_key}.json`;

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename=${filename}`);

    return new NextResponse(licenseContent, {
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