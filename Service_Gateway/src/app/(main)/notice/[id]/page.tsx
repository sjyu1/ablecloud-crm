// app/notice/[id]/page.tsx
import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import NoticeDetailClient from './noticeDetailClient';
import log from '@/utils/logger';

interface Notice {
  id: number;
  title: string;
  content: string;
  writer: string;
  level: string;
  created: string;
}

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchNotice(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/notice/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '공지사항 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function NoticeDetailPage({ params, searchParams }: PageProps) {
  log.info('API URL ::: GET /notice/' + params.id);

  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const username = (await cookieStore).get('username')?.value;

  if (!role) {
    return redirect('/login');
  }

  let notice: Notice | null = null;
  let errorMessage: string | null = null;

  try {
    notice = await fetchNotice(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '공지사항 정보를 불러오는 데 실패했습니다.';
    log.info('GET /notice/' + params.id + ' ERROR ::: ' + errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료 시 로그아웃
    }
  }

  const prevPage = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page ?? '1';
  const prevSearchField = Array.isArray(searchParams.searchField)
    ? searchParams.searchField[0]
    : searchParams.searchField ?? 'title';
  const prevSearchValue = Array.isArray(searchParams.searchValue)
    ? searchParams.searchValue[0]
    : searchParams.searchValue ?? '';

  if (errorMessage) {
    return (
      <div className="text-red-600 p-4">
        {errorMessage}
      </div>
    );
  }

  return (
    <NoticeDetailClient
      notice={notice}
      role={role}
      prevPage={prevPage}
      prevSearchField={prevSearchField}
      prevSearchValue={prevSearchValue}
    />
  );
}
