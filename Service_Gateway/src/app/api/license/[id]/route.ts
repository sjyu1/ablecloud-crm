import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';

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
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`);

    const license = await response.json();
    
    if (!license) {
      return NextResponse.json(
        { message: '라이센스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 200,
      data: license 
    });
  } catch (error) {
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
    const body = await request.json();

    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const license = await response.json();
    
    // if (license === -1) {
    //   return NextResponse.json(
    //     { message: '라이센스를 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // licenses[index] = { ...licenses[index], ...body };

    return NextResponse.json({ 
      status: 200,
      data: license.data 
    });
  } catch (error) {
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
    const response = await fetchWithAuth(`${process.env.LICENSE_API_URL}/license/${params.id}`,{
      method: 'DELETE',
    })

    // if (!response) {
    //   return NextResponse.json(
    //     { message: '라이센스를 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // licenses = licenses.filter(l => l.id !== parseInt(params.id));

    return NextResponse.json({ 
      status: 200,
      message: '라이센스가 삭제되었습니다.' 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '라이센스 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
