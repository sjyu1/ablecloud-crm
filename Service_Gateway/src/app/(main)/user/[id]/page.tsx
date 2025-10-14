import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import UserDetailClient from './userDetailClient';
import log from '@/utils/logger';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  type: string;
  telnum: string;
  role: string;
  company: string;
}

interface PageProps {
  params: { id: string };
  searchParams: {
    page?: string;
    type?: string;
    searchField?: string;
    searchValue?: string;
  };
}

// 사용자 상세 정보 조회 함수
async function fetchUserDetail(id: string): Promise<User | undefined> {
  try {
    const apiUrl = new URL(`${process.env.API_URL}/user/${id}`);
    const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || '사용자 정보를 가져오는 데 실패했습니다.');
    }

    return data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : '사용자 정보를 불러오는 데 실패했습니다.');
  }
}

export default async function UserDetailPage({ params, searchParams: searchParamsPromise }: PageProps) {
  log.info('API URL ::: GET /user/'+params.id);
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  const prevPage = searchParams.page || '1';
  const prevType = searchParams.type || 'partner';
  const prevSearchField = searchParams.searchField || 'username';
  const prevSearchValue = searchParams.searchValue || '';

  // const user = await fetchUserDetail(params.id);

  let user: User | undefined = undefined;
  let errorMessage: string | null = null;

  try {
    user = await fetchUserDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사용자 정보를 불러오는 데 실패했습니다.';
    log.info('GET /user/'+params.id+' ERROR ::: '+errorMessage);
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
    <UserDetailClient
      user={user}
      role={role}
      prevPage={prevPage}
      prevType={prevType}
      prevSearchField={prevSearchField}
      prevSearchValue={prevSearchValue}
    />
  );
}
