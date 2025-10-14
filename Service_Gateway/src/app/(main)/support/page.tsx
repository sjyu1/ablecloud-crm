import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import SupportListClient from './supportListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface Support {
  id: number;
  customer_id: string;
  customer: string;
  business_id: string;
  business: string;
  issued: string;
  type: string;
  issue: string;
  solution: string;
  actioned: string;
  action_type: string;
  manager: string;
  status: string;
  note: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface SupportPageProps {
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchSupportList(
  page: number,
  searchField: string,
  searchValue: string,
  role?: string,
  companyId?: string
): Promise<{ supports: Support[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/support`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');

  if (searchValue.trim()) {
    apiUrl.searchParams.set(searchField, searchValue.trim());
  }

  if (role === 'User') {
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '기술지원 정보를 가져오는 데 실패했습니다.');
  }

  return {
    supports: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  log.info('API URL ::: GET /support');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  const page = Number(searchParams.page || '1');
  const searchField = searchParams.searchField || 'name';
  const searchValue = searchParams.searchValue || '';

  let supports: Support[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchSupportList(page, searchField, searchValue, role, companyId);
    supports = result.supports;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '기술지원 목록을 불러오는 데 실패했습니다.';
    log.error('GET /support ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">기술지원 관리</h1>
        <Link
          href="/support/register"
          className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
        >
          기술지원 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <SupportListClient
          supports={supports}
          pagination={pagination}
          searchField={searchField}
          searchValue={searchValue}
          role={role}
        />
      )}
    </div>
  );
}
