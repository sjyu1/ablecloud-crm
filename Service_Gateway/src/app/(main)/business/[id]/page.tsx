import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import BusinessDetailClient from './businessDetailClient';
import log from '@/utils/logger';

interface Business {
  id: number;
  name: string;
  status: string;
  issued: string;
  expired: string;
  customer_name: string;
  node_cnt: number;
  core_cnt: number;
  license_key: string;
  license_status: string;
  license_issued: string;
  license_expired: string;
  license_trial: string;
  manager_id: string;
  manager_name: string;
  manager_company: string;
  product_name: string;
  product_version: string;
  details: string;
  deposit_use: string;
}

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchBusiness(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/business/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '사업 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function BusinessDetailPage({ params, searchParams: searchParamsPromise }: PageProps) {
  log.info('API URL ::: GET /business/'+params.id);
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  // business 조회
  let business: Business | null = null;
  let errorMessage: string | null = null;

  try {
    business = await fetchBusiness(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사업 정보를 불러올 수 없습니다.';
    log.info('GET /business/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage == 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료시 로그아웃
    }
  }

  // 검색 파라미터 (page, searchField, searchValue 등)
  const prevPage = Array.isArray(searchParams.page) ? searchParams.page[0] : (searchParams.page ?? '1');
  const prevSearchField = Array.isArray(searchParams.searchField)
    ? searchParams.searchField[0]
    : (searchParams.searchField ?? 'name');
  const prevSearchValue = Array.isArray(searchParams.searchValue)
    ? searchParams.searchValue[0]
    : (searchParams.searchValue ?? '');

  const initialTab = 0;

  if (errorMessage) {
    return (
      <div className="text-red-600">
        {errorMessage}
      </div>
    );
  }

  return (
    <BusinessDetailClient
      business={business}
      role={role}
      errorMessage={errorMessage ?? ''}
      prevPage={prevPage}
      prevSearchField={prevSearchField}
      prevSearchValue={prevSearchValue}
      initialTab={initialTab}
    />
  );
}
