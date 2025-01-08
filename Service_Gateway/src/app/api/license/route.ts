import { NextResponse } from 'next/server';
import { config } from '@/config';
import { fetchWithAuth } from '@/utils/api';
import { encryptBlob } from '@/utils/encryption';

/**
 * 라이센스 목록 조회
 * @returns 
 */
export async function GET() {
  try {
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '라이센스 조회에 실패했습니다.'
        },
        { status: response.status }
      );
    }

    // 데이터를 내림차순으로 정렬
    const sortedData = Array.isArray(data) 
      ? data.sort((a, b) => {
          // created_at이나 id 기준으로 정렬
          // return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return b.id - a.id;
        })
      : data;

    return NextResponse.json({ 
      success: true,
      status: 200,
      data: sortedData
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 라이센스 생성
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // blob 데이터가 있는 경우 암호화
    if (body.blob) {
      body.blob = await encryptBlob(body.blob);
    }
    
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || '라이센스 생성에 실패했습니다.'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      status: 201,
      data: data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: '라이센스 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
