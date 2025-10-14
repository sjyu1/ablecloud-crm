import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import PartnerListClient from './partnerListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface Partner {
  id: number;
  name: string;
  telnum: string;
  level: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PartnerPageProps {
  searchParams: {
    page?: string;
    level?: string;
    searchValue?: string;
  };
}

async function fetchPartnerList(
  page: number,
  level: string,
  searchValue: string,
  role?: string,
  companyId?: string
): Promise<{ data: Partner[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/partner`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');
  if (searchValue) {
    apiUrl.searchParams.set('name', searchValue);
  }
  if (level) {
    apiUrl.searchParams.set('level', level);
  }
  if (role === 'User') {
    apiUrl.searchParams.set('id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '파트너 정보를 가져오는 데 실패했습니다.');
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

export default async function PartnerPage({ searchParams: searchParamsPromise }: PartnerPageProps) {
  log.info('API URL ::: GET /partner');
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value || '';
  const companyId = (await cookieStore).get('companyId')?.value || '';

  const page = Number(searchParams.page || '1');
  const level = searchParams.level || 'PLATINUM';
  const searchValue = searchParams.searchValue || '';

  let partners: Partner[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchPartnerList(page, level, searchValue, role, companyId);
    partners = result.data;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '파트너 목록을 불러오는 데 실패했습니다.';
    log.info('GET /partner ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 관리</h1>
        <Link
          href="/partner/register"
          className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
        >
          파트너 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <PartnerListClient
          partners={partners}
          pagination={pagination}
          role={role}
          level={level}
          searchValue={searchValue}
          currentPage={page}
        />
      )}
    </div>
  );
}
