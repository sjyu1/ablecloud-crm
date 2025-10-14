import React from 'react';
import LicenseEditForm from './licenseEditForm';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import log from '@/utils/logger';

interface LicenseForm {
  id: number;
  license_key: string;
  product_id: string;
  product_name: string;
  business_name: string;
  issued: string;
  expired: string;
  trial: boolean | string;
}

interface LicenseEditPageProps {
  params: { id: string };
  searchParams?: {
    page?: string;
    trial?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchLicenseDetail(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/license/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok){
    throw new Error(data.message || '라이선스 정보를 가져오는 데 실패했습니다.');
  }
  return data.data;
}

export default async function LicenseEditPage({ params, searchParams: searchParamsPromise }: LicenseEditPageProps) {
  log.info('API URL ::: PUT /license/'+params.id);
  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevTrial = searchParams?.trial ?? '0';
  const prevSearchField = searchParams?.searchField ?? 'business_name';
  const prevSearchValue = searchParams?.searchValue ?? '';

  // const [license] = await Promise.all([
  //   fetchLicenseDetail(params.id),
  // ]);

  let license: LicenseForm | null = null;
  let errorMessage: string | null = null;

  try {
    license = await fetchLicenseDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '라이선스 정보를 찾을 수 없습니다.';
    log.info('PUT /license/'+params.id+' ERROR::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료 시 로그아웃
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이선스 수정</h1>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {errorMessage || !license ? (
          <div className="text-red-600">
            {errorMessage || '라이선스 정보를 불러올 수 없습니다.'}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <LicenseEditForm
              license={license}
              prevPage={prevPage}
              prevTrial={prevTrial}
              prevSearchField={prevSearchField}
              prevSearchValue={prevSearchValue}
            />
          </div>
        )}
      </div>
    </div>
  );
}
