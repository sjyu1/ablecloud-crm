import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import LicenseListClient from './licenseListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface License {
  id: number;
  license_key: string;
  product_id: string;
  product_name: string;
  product_version: string;
  business_name: string;
  issued_name: string;
  status: string;
  issued: string;
  expired: string;
  trial: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface LicensePageProps {
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
    trial?: string;
  };
}

async function fetchLicenseList(
  page: number,
  searchField: string,
  searchValue: string,
  trial: string,
  role?: string,
  companyId?: string
): Promise<{ licenses: License[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/license`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');
  apiUrl.searchParams.set('trial', trial);

  if (searchValue) {
    apiUrl.searchParams.set(searchField, searchValue);
  }

  if (role === 'User') {
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '라이선스 정보를 가져오는 데 실패했습니다.');
  }

  return {
    licenses: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function LicensePage({ searchParams: searchParamsPromise }: LicensePageProps) {
  log.info('API URL ::: GET /license');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  const searchParams = await searchParamsPromise;

  const page = Number(searchParams.page || '1');
  const searchField = searchParams.searchField || 'business_name';
  const searchValue = searchParams.searchValue || '';
  const trial = searchParams.trial || '0';

  let licenses: License[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchLicenseList(page, searchField, searchValue, trial, role, companyId);
    licenses = result.licenses;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '라이선스 목록을 불러오는 데 실패했습니다.';
    log.info('GET /license ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이선스 관리</h1>
        <Link
          href="/license/register"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          라이선스 생성
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">
          {errorMessage}
        </div>
      ) : (
        <LicenseListClient
          licenses={licenses}
          pagination={pagination}
          trial={trial}
          searchField={searchField}
          searchValue={searchValue}
          currentPage={page}
          role={role}
        />
      )}
    </div>
  );
}
