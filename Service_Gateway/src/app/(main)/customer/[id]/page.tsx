import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import CustomerDetailClient from './customerDetailClient';
import log from '@/utils/logger';

interface Customer {
  id: number;
  name: string;
  telnum: string;
  created: string;
  business_id: string;
  business_name: string;
  business_node_cnt: string;
  business_core_cnt: string;
  business_status: string;
  business_issued: string;
  business_expired: string;
  manager_name: string;
  manager_company: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  telnum: string;
}

interface Props {
  params: { id: string };
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchCustomer(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/customer/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '고객 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

async function fetchUser(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/user?type=customer&company_id=${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '고객 담당자 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function CustomerDetailPage({ params, searchParams: searchParamsPromise }: Props) {
  log.info('API URL ::: GET /customer/'+params.id);
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  // const companyId = (await cookieStore).get('companyId')?.value;

  // customer 조회
  // const customer = await fetchCustomer(params.id);
  // user 조회
  // const user = await fetchUser(params.id);

  let customer: Customer | null = null;
  let user: User[] = [];
  let errorMessage: string | null = null;

  try {
    customer = await fetchCustomer(params.id);
    user = await fetchUser(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '고객 정보를 불러오는 데 실패했습니다.';
    log.info('GET /customer/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  if (errorMessage) {
    return (
      <div className="text-red-600">
        {errorMessage}
      </div>
    );
  }

  return (
    <CustomerDetailClient
      customer={customer}
      users={user}
      role={role}
      params={params}
      searchParams={searchParams}
    />
  );
}
