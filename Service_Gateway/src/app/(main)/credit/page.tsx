import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import CreditListClient from './creditListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface Credit {
  id: number;
  deposit: number;
  credit: number;
  partner: string;
  business: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface CreditPageProps {
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchCreditList(
  page: number,
  searchField: string,
  searchValue: string,
  role?: string
): Promise<{ credits: Credit[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/credit`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');

  if (searchValue.trim()) {
    apiUrl.searchParams.set(searchField, searchValue.trim());
  }

  if (role === 'User') {
    apiUrl.searchParams.set('role', 'User');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '크레딧 정보를 가져오는 데 실패했습니다.');
  }

  return {
    credits: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function CreditPage({ searchParams: searchParamsPromise }: CreditPageProps) {
  log.info('API URL ::: GET /credit');
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  const page = Number(searchParams.page || '1');
  const searchField = searchParams.searchField || 'type';
  const searchValue = searchParams.searchValue || '';

  let credits: Credit[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchCreditList(page, searchField, searchValue, role);
    credits = result.credits;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '크레딧 목록을 불러오는 데 실패했습니다.';
    log.info('GET /credit ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">크레딧 관리</h1>
        <Link
          href="/credit/register"
          className={
            role === 'Admin'
              ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
              : 'hidden'
          }
        >
          크레딧 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <CreditListClient
          credits={credits}
          pagination={pagination}
          role={role}
          searchField={searchField}
          searchValue={searchValue}
          currentPage={page}
        />
      )}
    </div>
  );
}
