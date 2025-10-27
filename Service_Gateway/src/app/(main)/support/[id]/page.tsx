import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import SupportDetailClient from './supportDetailClient';
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
  requester: string;
  requester_telnum: string;
  requester_email: string;
  note: string;
  writer: string;
}

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchSupport(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/support/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '기술지원 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function SupportDetailPage({ params, searchParams }: PageProps) {
  log.info('API URL ::: GET /support/' + params.id);

  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  let support: Support | null = null;
  let errorMessage: string | null = null;

  try {
    support = await fetchSupport(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '기술지원 정보를 불러오는 데 실패했습니다.';
    log.info('GET /support/' + params.id + ' ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  const prevPage = Array.isArray(searchParams.page) ? searchParams.page[0] : (searchParams.page ?? '1');
  const prevSearchField = Array.isArray(searchParams.searchField)
    ? searchParams.searchField[0]
    : (searchParams.searchField ?? 'name');
  const prevSearchValue = Array.isArray(searchParams.searchValue)
    ? searchParams.searchValue[0]
    : (searchParams.searchValue ?? '');

  if (errorMessage) {
    return (
      <div className="text-red-600 p-4">
        {errorMessage}
      </div>
    );
  }

  return (
    <SupportDetailClient
      support={support}
      role={role}
      prevPage={prevPage}
      prevSearchField={prevSearchField}
      prevSearchValue={prevSearchValue}
    />
  );
}
