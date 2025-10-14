import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import Link from 'next/link';
import CustomerListClient from './customerListClient';
import log from '@/utils/logger';

interface Customer {
  id: number;
  name: string;
  telnum: string;
  created: string;
  manager_name: string;
  manager_company: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PageProps {
  searchParams?: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchCustomerList(
  page: number,
  searchField?: string,
  searchValue?: string,
  role?: string,
  companyId?: string
): Promise<{ data: Customer[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/customer`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');
  if (searchField && searchValue) {
    apiUrl.searchParams.set(searchField, searchValue);
  }
  if (role === 'User') {
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '고객 정보를 가져오는 데 실패했습니다.');
  }

  return {
    data: data.data,
    pagination: data.pagination,
  };
}

export default async function CustomerPage({ searchParams: searchParamsPromise }: PageProps) {
  log.info('API URL ::: GET /customer');
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value || '';
  const companyId = (await cookieStore).get('companyId')?.value || '';

  const page = Number(searchParams?.page || '1');
  const searchField = searchParams?.searchField ?? 'name';
  const searchValue = searchParams?.searchValue ?? '';

  let customers: Customer[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchCustomerList(page, searchField, searchValue, role, companyId);
    customers = result.data;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '고객 목록을 불러오는 데 실패했습니다.';
    log.info('GET /customer ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">고객 관리</h1>
        <Link
          href="/customer/register"
          className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
        >
          고객 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <CustomerListClient
          customers={customers}
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
