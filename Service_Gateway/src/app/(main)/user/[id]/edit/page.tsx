import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import UserEditClient from './userEditClient';
import log from '@/utils/logger';

interface UserForm {
  id: string;
  username: string;
  email: string;
  firstName: string;
  type: string;
  telnum: string;
  role: string;
  company_id: string;
}

interface PageProps {
  params: { id: string };
  searchParams?: {
    page?: string;
    type?: string;
    searchField?: string;
    searchValue?: string;
  };
}

async function fetchUserDetail(id: string): Promise<UserForm> {
  const apiUrl = new URL(`${process.env.API_URL}/user/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || '사용자 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function UserEditPage({ params, searchParams: searchParamsPromise }: PageProps) {
  log.info('API URL ::: PUT /user/'+params.id);
  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevType = searchParams?.type ?? 'partner';
  const prevSearchField = searchParams?.searchField ?? 'username';
  const prevSearchValue = searchParams?.searchValue ?? '';

  let user: UserForm | null = null;
  let errorMessage: string | null = null;

  try {
    user = await fetchUserDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사용자 정보를 불러오는 데 실패했습니다.';
    log.info('PUT /user/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout'); // 인증 토큰 만료 시 로그아웃
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사용자 수정</h1>
      </div>

      {errorMessage || !user ? (
        <div className="text-red-600">
          {errorMessage || '사용자 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <UserEditClient
            user={user}
            prevPage={prevPage}
            prevType={prevType}
            prevSearchField={prevSearchField}
            prevSearchValue={prevSearchValue}
          />
        </div>
      )}
    </div>
  );
}
