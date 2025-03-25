import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';

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
    const response = await fetchWithAuth(`${process.env.BUSINESS_API_URL}/business/${params.id}`);

    const business = await response.json();
    
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
    return NextResponse.json(
      { message: '사업 조회 중 오류가 발생했습니다.' },
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
    const body = await request.json();

    const response = await fetchWithAuth(`${process.env.BUSINESS_API_URL}/business/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const business = await response.json();
    
    // if (business === -1) {
    //   return NextResponse.json(
    //     { message: '사업을 찾을 수 없습니다.' },
    //     { status: 404 }
    //   );
    // }

    // businesss[index] = { ...businesss[index], ...body };

    return NextResponse.json({ 
      status: 200,
      data: business.data 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '사업 수정 중 오류가 발생했습니다.' },
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
    const response = await fetchWithAuth(`${process.env.BUSINESS_API_URL}/business/${params.id}`,{
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
    return NextResponse.json(
      { message: '사업 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
