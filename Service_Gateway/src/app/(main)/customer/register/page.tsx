import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import CustomerRegisterFormClient from './customerRegisterFormClient';
import log from '@/utils/logger';

interface Manager {
  id: number;
  username: string;
  company: string;
  company_id: string;
}

async function fetchManagers(role?: string, companyId?: string): Promise<Manager[]> {
  const apiUrl = new URL(`${process.env.API_URL}/user/forCreateManager`);
  apiUrl.searchParams.set('order', 'name'); // 이름순 정렬
  if (role === 'User') {  // 파트너일 경우
    apiUrl.searchParams.set('company_id', companyId ?? '');
    apiUrl.searchParams.set('type', 'partner');
  }

  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '사업 담당자 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function CustomerRegisterPage() {
  log.info('API URL ::: POST /customer');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  // const managers = await fetchManagers(role, companyId);

  let managers: Manager[] = [];
  let errorMessage: string | null = null;

  try {
    managers = await fetchManagers(role, companyId);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사업담당자 정보를 불러오는 데 실패했습니다.';
    log.info('POST /customer ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">고객 등록</h1>
  
      {errorMessage ? (
        <div className="text-red-600">
          {errorMessage}
        </div>
      ) : (
        <CustomerRegisterFormClient managers={managers} role={role} />
      )}
    </div>
  );
  
}
