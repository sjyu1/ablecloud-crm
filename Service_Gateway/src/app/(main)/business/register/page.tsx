import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import BusinessRegisterForm from './businessRegisterForm';
import log from '@/utils/logger';

interface Manager {
  id: number;
  username: string;
  company: string;
  company_id: string;
  deposit: string;
  credit: string;
}

interface Customer {
  id: number;
  name: string;
  telnum: string;
}

async function fetchManagers(role?: string): Promise<Manager[]> {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('companyId')?.value;

  const apiUrl = new URL(`${process.env.API_URL}/user/forCreateManager`);
  apiUrl.searchParams.set('order', 'name'); // 이름순 정렬
  if (role === 'User') {  // 파트너일 경우
    apiUrl.searchParams.set('company_id', companyId ?? '');
    apiUrl.searchParams.set('type', 'partner');
  }

  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '담당자 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

async function fetchCustomers(role?: string): Promise<Customer[]> {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('companyId')?.value;

  const apiUrl = new URL(`${process.env.API_URL}/customer?page=1&limit=10000`);
  apiUrl.searchParams.set('order', 'name'); // 이름순 정렬
  if (role === 'User') {  // 파트너일 경우
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '고객 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function BusinessRegisterPage() {
  log.info('API URL ::: POST /business');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  // const managers = await fetchManagers(role);
  // const customers = await fetchCustomers(role);

  let managers: Manager[] = [];
  let customers: Customer[] = [];
  let errorMessage: string | null = null;

  try {
    managers = await fetchManagers(role);
    customers = await fetchCustomers(role);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사업 목록을 불러오는 데 실패했습니다.';
    log.info('POST /business ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">사업 등록</h1>
  
      {errorMessage ? (
        <div className="text-red-600">
          {errorMessage}
        </div>
      ) : (
        <BusinessRegisterForm managers={managers} customers={customers} role={role} />
      )}
    </div>
  );
}
