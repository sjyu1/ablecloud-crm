// app/notice/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import NoticeListClient from './noticeListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface Notice {
  id: number;
  title: string;
  writer: string;
  level: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface NoticePageProps {
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchNoticeList(
  page: number,
  searchField: string,
  searchValue: string,
  role?: string,
  companyId?: string
): Promise<{ notices: Notice[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/notice`);
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
    throw new Error(data.message || '공지사항 정보를 가져오는 데 실패했습니다.');
  }

  return {
    notices: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function NoticePage({ searchParams }: NoticePageProps) {
  log.info('API URL ::: GET /notice');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  const page = Number(searchParams.page || '1');
  const searchField = searchParams.searchField || 'title';
  const searchValue = searchParams.searchValue || '';

  let notices: Notice[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchNoticeList(page, searchField, searchValue, role, companyId);
    notices = result.notices;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '공지사항 목록을 불러오는 데 실패했습니다.';
    log.error('GET /notice ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 관리</h1>
        <Link
          href="/notice/register"
          className={
            role === 'Admin'
              ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
              : 'hidden'
          }
        >
          공지사항 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <NoticeListClient
          notices={notices}
          pagination={pagination}
          searchField={searchField}
          searchValue={searchValue}
          role={role}
        />
      )}
    </div>
  );
}
