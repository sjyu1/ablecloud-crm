import { NextResponse } from 'next/server';

interface License {
  id: number;
  name: string;
  type: string;
  key: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
}

// 임시 데이터
const licenses: License[] = [
  {
    id: 1,
    name: "Enterprise License",
    type: "Enterprise",
    key: "ENT-123-456",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    description: "기업용 라이센스"
  }
];

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    const license = licenses.find(l => l.key === key && l.isActive);

    if (!license) {
      return NextResponse.json({ 
        status: 400,
        valid: false,
        message: '유효하지 않은 라이센스입니다.' 
      });
    }

    const now = new Date();
    const startDate = new Date(license.startDate);
    const endDate = new Date(license.endDate);
    const isValid = now >= startDate && now <= endDate;

    return NextResponse.json({ 
      status: 200,
      valid: isValid,
      message: isValid ? '유��한 라이센스입니다.' : '만료된 라이센스입니다.' 
    });
  } catch (error) {
    return NextResponse.json(
      { message: '라이센스 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 