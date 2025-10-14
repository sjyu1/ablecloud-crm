import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import PartnerDetailClient from './partnerDetailClient';
import log from '@/utils/logger';

interface Partner {
  id: number;
  name: string;
  telnum: string;
  level: string;
  deposit: string;
  credit: string;
  created: string;
  product_category_names: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  telnum: string;
}

interface PageProps {
  params: { id: string };
  searchParams: { page?: string; level?: string; searchValue?: string };
}

async function fetchPartner(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/partner/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '파트너 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

async function fetchUser(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/user?type=partner&company_id=${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '파트너 담당자 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function PartnerDetailPage({ params, searchParams: searchParamsPromise }: PageProps) {
  log.info('API URL ::: GET /partner/'+params.id);
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  // partner 조회
  // const partner = await fetchPartner(params.id);
  // user 조회
  // const user = await fetchUser(params.id);

  let partner: Partner | null = null;
  let user: User[] | null = null;
  let errorMessage: string | null = null;

  try {
    partner = await fetchPartner(params.id);
    user = await fetchUser(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '파트너 정보를 불러오는 데 실패했습니다.';
    log.info('GET /partner/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  if (errorMessage) {
    return (
      <div className="text-red-600">
        {errorMessage}
      </div>
    );
  }

  return (
    <PartnerDetailClient
      partner={partner}
      users={user ?? []}
      role={role}
      params={params}
      searchParams={searchParams}
    />
  );
}
