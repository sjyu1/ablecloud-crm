import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import CreditDetailClient from './creditDetailClient';
import log from '@/utils/logger';

interface Credit {
  id: string;
  partner_id: string;
  partner: string;
  business_id: string;
  business: string;
  deposit: string;
  credit: string;
  note: string;
  created: string;
  deposit_use: string;
}

interface PageProps {
  params: { id: string };
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchCreditDetail(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/credit/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '크레딧 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function CreditDetailPage({ params, searchParams }: PageProps) {
  log.info(`API URL ::: GET /credit/${params.id}`);

  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  const prevPage = searchParams.page || '1';
  const prevSearchField = searchParams.searchField || 'type';
  const prevSearchValue = searchParams.searchValue || '';

  let credit: Credit | null = null;
  let errorMessage: string | null = null;

  try {
    credit = await fetchCreditDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
    log.error('GET /credit/:id ERROR ::: ' + errorMessage);

    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <CreditDetailClient
      credit={credit}
      role={role}
      errorMessage={errorMessage}
      prevPage={prevPage}
      prevSearchField={prevSearchField}
      prevSearchValue={prevSearchValue}
    />
  );
}
