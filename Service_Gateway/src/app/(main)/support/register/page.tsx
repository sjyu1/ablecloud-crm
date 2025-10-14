import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import SupportRegisterForm from './supportRegisterForm';
import log from '@/utils/logger';

interface Customer {
  id: number;
  name: string;
  telnum: string;
}

async function fetchCustomers(): Promise<Customer[]> {
  const apiUrl = new URL(`${process.env.API_URL}/customer?page=1&limit=10000&order=name`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '고객 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function SupportRegisterPage() {
  log.info('API URL ::: POST /customer');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const username = (await cookieStore).get('username')?.value;

  let customers: Customer[] = [];
  let errorMessage: string | null = null;

  try {
    customers = await fetchCustomers();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '고객 정보를 불러오는 데 실패했습니다.';
    log.error('POST /customer ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">기술지원 등록</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {errorMessage ? (
          <div className="text-red-600">
            {errorMessage}
          </div>
        ) : (
          <SupportRegisterForm
            customers={customers}
            role={role}
            username={username}
          />
        )}
      </div>
    </div>
  );
}

