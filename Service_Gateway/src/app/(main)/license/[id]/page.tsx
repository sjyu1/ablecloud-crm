import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import LicenseDetailClient from './licenseDetailClient';
import log from '@/utils/logger';

interface License {
  id: number;
  license_key: string;
  product_id: string;
  product_name: string;
  product_version: string;
  status: string;
  issued: string;
  expired: string;
  issued_user: string;
  company_name: string;
  created: string;
  approve_user: string;
  approved: string;
  business_id: string;
  business_name: string;
  issued_name: string;
  trial: string;
  oem: string;
}

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchLicense(id: string) {
  try {
    const apiUrl = new URL(`${process.env.API_URL}/license/${id}`);
    const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || '라이센스 정보를 가져오는 데 실패했습니다.');
    }

    return data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : '라이선스 정보를 불러오는 데 실패했습니다.');
        // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
  }
}

export default async function LicenseDetailPage({ params, searchParams: searchParamsPromise}: PageProps) {
  log.info('API URL ::: GET /license/'+params.id);
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  // license 조회
  // const license = await fetchLicense(params.id);

  let license: License | null = null;
  let errorMessage: string | null = null;

  try {
    license = await fetchLicense(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '라이선스 정보를 불러오는 데 실패했습니다.';
    log.info('GET /customer/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  // 검색 파라미터 (page, searchField, searchValue 등)
  const prevPage = Array.isArray(searchParams.page) ? searchParams.page[0] : (searchParams.page ?? '1');
  const prevTrial = Array.isArray(searchParams.trial) ? searchParams.trial[0] : (searchParams.trial ?? '0');
  const prevSearchField = Array.isArray(searchParams.searchField)
    ? searchParams.searchField[0]
    : (searchParams.searchField ?? 'business_name');
  const prevSearchValue = Array.isArray(searchParams.searchValue)
    ? searchParams.searchValue[0]
    : (searchParams.searchValue ?? '');

  if (errorMessage) {
    return (
      <div className="text-red-600">
        {errorMessage}
      </div>
    );
  }

  return (
    <LicenseDetailClient
      license={license}
      role={role}
      prevPage={prevPage}
      prevTrial={prevTrial}
      prevSearchField={prevSearchField}
      prevSearchValue={prevSearchValue}
    />
  );
}
