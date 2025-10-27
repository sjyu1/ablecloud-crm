import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import ClientBusinessList from './clientBusinessList';
import Link from 'next/link';
import log from '@/utils/logger';

interface Business {
  id: number;
  name: string;
  issued: string;
  expired: string;
  customer_name: string;
  status: string;
  manager_name: string;
  manager_company: string;
  product_name: string;
  product_version: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface BusinessPageProps {
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

const statusMap: Record<string, string> = {
  standby: '대기 중',
  meeting: '고객 미팅',
  poc: 'PoC',
  bmt: 'BMT',
  ordering: '발주',
  proposal: '제안',
  ordersuccess: '수주 성공',
  cancel: '취소',
};

async function fetchBusiness(
  page: number,
  searchField: string,
  searchValue: string,
  role?: string,
  companyId?: string
): Promise<{ businesses: Business[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/business`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');

  if (searchValue) {
    apiUrl.searchParams.set(searchField, searchValue);
  }

  if (role === 'User') {
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '사업 정보를 가져오는 데 실패했습니다.');
  }

  return {
    businesses: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function BusinessPage({ searchParams: searchParamsPromise }: BusinessPageProps) {
  log.info('API URL ::: GET /business');
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;
  const searchParam = await searchParams;

  const page = Number(searchParam.page || '1');
  const searchField = searchParam.searchField || 'name';
  const searchValue = searchParam.searchValue || '';

  // business 조회
  let businesses: Business[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchBusiness(page, searchField, searchValue, role, companyId);
    businesses = result.businesses;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사업 목록을 불러오는 데 실패했습니다.';
    log.info('GET /business ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 관리</h1>
        <Link
          href="/business/register"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          사업 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">
          {errorMessage}
        </div>
      ) : (
        <ClientBusinessList
          businesses={businesses}
          pagination={pagination}
          searchField={searchField}
          searchValue={searchValue}
          role={role}
        />
      )}
    </div>
  );
}
