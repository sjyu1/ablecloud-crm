import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import CreditEditClient from './creditEditClient';
import log from '@/utils/logger';

interface CreditEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; searchField?: string; searchValue?: string };
}

interface CreditForm {
  id: number;
  partner_id: string;
  partner: string;
  business_id: string;
  business: string;
  deposit: number;
  credit: number;
  note: string;
}

async function fetchCreditDetail(id: string): Promise<CreditForm> {
  const apiUrl = new URL(`${process.env.API_URL}/credit/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '크레딧 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function CreditEditPage({
  params,
  searchParams: searchParamsPromise,
}: CreditEditPageProps) {
  log.info('API URL ::: PUT /credit/' + params.id);

  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevSearchField = searchParams?.searchField ?? 'type';
  const prevSearchValue = searchParams?.searchValue ?? '';

  let credit: CreditForm | null = null;
  let errorMessage: string | null = null;

  try {
    credit = await fetchCreditDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '크레딧 정보를 찾을 수 없습니다.';
    log.info('PUT /credit/' + params.id + ' ERROR ::: ' + errorMessage);

    // 토큰 만료 시 로그아웃 처리
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">크레딧 수정</h1>
      </div>

      {errorMessage || !credit ? (
        <div className="text-red-600">
          {errorMessage || '크레딧 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <CreditEditClient
            initialData={credit}
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
