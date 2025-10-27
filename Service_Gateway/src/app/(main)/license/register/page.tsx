import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import LicenseRegisterForm from './licenseRegisterForm';
import log from '@/utils/logger';

interface Business {
  id: number;
  name: string;
  product_name: string;
  product_version: string;
  product_category_name: string;
  manager_company_id: string;
}

async function fetchBusiness(role?: string): Promise<Business[]> {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('companyId')?.value;

  const apiUrl = new URL(`${process.env.API_URL}/business`);
  apiUrl.searchParams.set('page', '1');
  apiUrl.searchParams.set('limit', '10000');
  apiUrl.searchParams.set('available', 'true');
  apiUrl.searchParams.set('order', 'name'); // 이름순 정렬
  if (role === 'User') {  // 파트너일 경우
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '사업 정보를 가져오는 데 실패했습니다.');
  }
  return data.data;
}

export default async function LicenseRegisterPage() {
  log.info('API URL ::: POST /license');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  // 사업 조회
  // const business = await fetchBusiness(role);

  let business: Business[] = [];
  let errorMessage: string | null = null;

  try {
    business = await fetchBusiness(role);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사업 정보를 불러오는 데 실패했습니다.';
    log.info('POST /license ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">라이선스 생성</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {errorMessage ? (
          <div className="text-red-600">
            {errorMessage}
          </div>
        ) : (
          <LicenseRegisterForm business={business} role={role} />
        )}
      </div>
    </div>
  );
}
