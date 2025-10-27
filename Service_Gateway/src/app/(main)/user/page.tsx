import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import UserListClient from './userListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  type: string;
  role: string;
  company: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface UserPageProps {
  searchParams: {
    page?: string;
    type?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchUserList(
  page: number,
  type: string,
  searchField: string,
  searchValue: string,
  role?: string,
  companyId?: string
): Promise<{ data: User[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/user`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');

  if (searchField && searchValue) {
    apiUrl.searchParams.set(searchField, searchValue);
  }
  if (type) {
    apiUrl.searchParams.set('type', type);
  }
  if (role === 'User') {
    if (type == 'partner') {
      apiUrl.searchParams.set('company_id', companyId ?? '');
    } else {
      apiUrl.searchParams.set('manager_company_id', companyId ?? '');
    }
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '사용자 정보를 가져오는 데 실패했습니다.');
  }

  return {
    data: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function UserPage({ searchParams: searchParamsPromise }: UserPageProps) {
  log.info('API URL ::: GET /user');
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value || '';
  const companyId = (await cookieStore).get('companyId')?.value || '';

  const page = Number(searchParams.page || '1');
  const type = searchParams.type || 'partner';
  const searchField = searchParams.searchField || 'username';
  const searchValue = searchParams.searchValue || '';

  let users: User[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchUserList(page, type, searchField, searchValue, role, companyId);
    users = result.data;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사용자 목록을 불러오는 데 실패했습니다.';
    log.info('GET /user ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사용자 관리</h1>
        <Link
          href="/user/register"
          className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
        >
          사용자 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <UserListClient
          users={users}
          pagination={pagination}
          role={role}
          type={type}
          searchField={searchField}
          searchValue={searchValue}
          currentPage={page}
        />
      )}
    </div>
  );
}
