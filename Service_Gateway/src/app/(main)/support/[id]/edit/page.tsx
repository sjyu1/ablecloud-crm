import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import SupportEditForm from './supportEditForm';
import log from '@/utils/logger';

interface SupportEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; searchField?: string; searchValue?: string };
}

interface SupportForm {
  id: number;
  customer_id: string;
  business_id: string;
  issued: string;
  type: string;
  issue: string;
  solution: string;
  actioned: string;
  action_type: string;
  manager: string;
  status: string;
  requester: string;
  requester_telnum: string;
  requester_email: string;
  note: string;
}

interface Customer {
  id: number;
  name: string;
  telnum: string;
}

interface Business {
  id: number;
  name: string;
}

async function fetchSupportDetail(id: string): Promise<SupportForm> {
  const apiUrl = new URL(`${process.env.API_URL}/support/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '기술지원 정보를 불러올 수 없습니다.');
  }

  return data.data;
}

async function fetchCustomers(role?: string): Promise<Customer[]> {
  let url = `${process.env.API_URL}/customer?page=1&limit=10000&order=name`;
  if (role === 'User') url += `&role=User`;
  const res = await fetchWithAuth(url, { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data.data;
}

async function fetchBusinesses(customerId?: string, role?: string): Promise<Business[]> {
  let url = `${process.env.API_URL}/business?page=1&limit=10000&order=name`;
  if (role === 'User') url += `&role=User`;
  if (customerId) url += `&customer_id=${customerId}`;
  const res = await fetchWithAuth(url, { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data.data;
}

export default async function SupportEditPage({ params, searchParams: searchParamsPromise }: SupportEditPageProps) {
  log.info(`API URL ::: GET /support/${params.id}`);

  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevSearchField = searchParams?.searchField ?? 'name';
  const prevSearchValue = searchParams?.searchValue ?? '';

  const cookieStore = cookies();
  const role = await (await cookieStore).get('role')?.value;

  let support: SupportForm | null = null;
  let customers: Customer[] = [];
  let businesses: Business[] = [];
  let errorMessage: string | null = null;

  try {
    [support, customers] = await Promise.all([
      fetchSupportDetail(params.id),
      fetchCustomers(role),
    ]);

    businesses = await fetchBusinesses(support.customer_id, role);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 데 실패했습니다.';
    log.info(`GET /support/${params.id} ERROR ::: ${errorMessage}`);

    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료 시 로그아웃
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">기술지원 수정</h1>
      </div>

      {errorMessage || !support ? (
        <div className="text-red-600">
          {errorMessage || '기술지원 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <SupportEditForm
            initialData={support}
            customers={customers}
            businesses={businesses}
            role={role}
            searchParams={{
              page: prevPage,
              searchField: prevSearchField,
              searchValue: prevSearchValue,
            }}
          />
        </div>
      )}
    </div>
  );
}
