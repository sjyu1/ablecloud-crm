'use client';

import { useRouter } from 'next/navigation';

interface Notice {
  id: number;
  title: string;
  content: string;
  writer: string;
  level: string;
  created: string;
}

interface NoticeDetailClientProps {
  notice: Notice | null;
  role?: string;
  prevPage: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function NoticeDetailClient({
  notice,
  role,
  prevPage,
  prevSearchField,
  prevSearchValue,
}: NoticeDetailClientProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notice/${notice?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('공지사항이 삭제되었습니다.');
        router.push(`/notice?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
      } else {
        const data = await response.json();
        alert(data.message || '공지사항 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 상세정보</h1>
        <div className="space-x-2">
          {role === 'Admin' && (
            <>
              <button
                onClick={() =>
                  router.push(
                    `/notice/${notice?.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
                  )
                }
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                삭제
              </button>
            </>
          )}
          <button
            onClick={() =>
              router.push(
                `/notice?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            목록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">등급</h3>
            <p className="mt-1 text-lg text-gray-900">{notice?.level}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">제목</h3>
            <p className="mt-1 text-lg text-gray-900">{notice?.title}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">내용</h3>
            <textarea
              readOnly
              value={notice?.content ?? ''}
              rows={10}
              className="w-1/2 mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">작성자</h3>
            <p className="mt-1 text-lg text-gray-900">{notice?.writer}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">생성일</h3>
            <p className="mt-1 text-lg text-gray-900">{notice ? new Date(notice.created).toLocaleString() : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
