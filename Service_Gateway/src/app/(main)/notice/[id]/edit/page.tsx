import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import NoticeEditForm from './noticeEditForm';
import log from '@/utils/logger';

interface NoticeEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; searchField?: string; searchValue?: string };
}

interface NoticeForm {
  id: number;
  title: string;
  content: string;
  level: string[];
}

async function fetchNoticeDetail(id: string): Promise<NoticeForm> {
  const apiUrl = new URL(`${process.env.API_URL}/notice/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '공지사항 정보를 불러올 수 없습니다.');
  }

  const notice = data.data;

  // level 문자열 → 배열 변환 처리
  notice.level = Array.isArray(notice.level)
    ? notice.level
    : (notice.level || '')
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean);

  return notice;
}

export default async function NoticeEditPage({ params, searchParams: searchParamsPromise }: NoticeEditPageProps) {
  log.info(`API URL ::: GET /notice/${params.id}`);

  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevSearchField = searchParams?.searchField ?? 'title';
  const prevSearchValue = searchParams?.searchValue ?? '';

  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  let notice: NoticeForm | null = null;
  let errorMessage: string | null = null;

  try {
    notice = await fetchNoticeDetail(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 데 실패했습니다.';
    log.info(`GET /notice/${params.id} ERROR ::: ${errorMessage}`);

    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료 시 로그아웃 처리
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 수정</h1>
      </div>

      {errorMessage || !notice ? (
        <div className="text-red-600">
          {errorMessage || '공지사항 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <NoticeEditForm
            initialData={notice}
            role={role}
            searchParams={{
              page: prevPage,
              searchField: prevSearchField,
              searchValue: prevSearchValue,
            }}
          />
        </div>
      )}
    </div>
  );
}
