import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import CustomerEditFormClient from './customerEditFormClient';
import log from '@/utils/logger';

interface CustomerEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; searchField?: string; searchValue?: string };
}

interface CustomerForm {
  id: number;
  name: string;
  telnum: string;
}

async function fetchCustomerDetail(id: string): Promise<CustomerForm> {
  const apiUrl = new URL(`${process.env.API_URL}/customer/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '고객 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function CustomerEditPage({ params, searchParams: searchParamsPromise }: CustomerEditPageProps) {
  log.info('API URL ::: PUT /customer/'+params.id);
  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevSearchField = searchParams?.searchField ?? 'name';
  const prevSearchValue = searchParams?.searchValue ?? '';

  let customer: CustomerForm | null = null;
  let errorMessage: string | null = null;

  try {
    customer = await fetchCustomerDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '고객 정보를 찾을 수 없습니다.';
    log.info('PUT /customer/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료 시 로그아웃
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">고객 수정</h1>
      </div>

      {errorMessage || !customer ? (
        <div className="text-red-600">
          {errorMessage || '고객 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <CustomerEditFormClient
            initialData={customer}
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
