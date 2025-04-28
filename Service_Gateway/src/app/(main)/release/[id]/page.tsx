'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import MDEditor from '@uiw/react-md-editor';

interface Release {
  id: number;
  version: string;
  contents: string;
  created: string;
}

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [release, setRelease] = useState<Release | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [value, setValue] = useState(0);
  const [releaseHtml, setReleaseHtml] = useState('');

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchReleaseDetail();
  }, []);

  const fetchReleaseDetail = async () => {
    try {
      const response = await fetch(`/api/release/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '릴리즈노트 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setRelease(result.data);

      // Markdown → HTML 변환 (remark-gfm 플러그인 적용)
      const processedContent = await remark()
      .use(remarkGfm)
      .use()
      .use(html)
      .process(result.data.contents);
        
      const contentHtml = processedContent.toString();
      console.log(contentHtml)
      setReleaseHtml(contentHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      if (err instanceof Error) {
        if (err.message == 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisabled = async () => {
    if (!confirm('정말 이 릴리즈노트를 비활성화 하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/release/${params.id}/disabled`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('릴리즈노트가 비활성화 되었습니다.');
      } else {
        throw new Error('릴리즈노트 비활성화에 실패했습니다.');
      }

      router.push(`/release/${params.id}?page=${prevPage}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };
  const handleDelete = async () => {
    if (!confirm('정말 이 릴리즈노트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/release/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('릴리즈노트가 삭제되었습니다.');
      } else {
        throw new Error('릴리즈노트 삭제에 실패했습니다.');
      }

      router.push('/release');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="text-red-500">{error}</div>
  //     </div>
  //   );
  // }

  if (!release) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
        <div className="text-gray-500">릴리즈노트를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">릴리즈노트 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={handleDisabled}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            릴리즈노트 비활성화
          </button>
          <button
            onClick={() => router.push(`/release/${release.id}/edit?page=${prevPage}`)}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors' : 'hidden'}
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/release?page=${prevPage}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* <div>
              <h3 className="text-sm font-medium text-gray-500">제품버전</h3>
              <p className="mt-1 text-lg text-gray-900">
              {release.version}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">릴리즈</h3> */}
              {/* <div className="prose prose-sm max-w-none text-gray-900"/> */}
              <MDEditor.Markdown style={{ padding: 10 }} source={releaseHtml} />
              {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}