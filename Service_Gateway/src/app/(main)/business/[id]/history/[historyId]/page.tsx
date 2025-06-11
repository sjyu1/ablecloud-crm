'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../../../store/authStore';

interface Business_history {
  id: number;
  business_id: number;
  issue: string;
  solution: string;
  status: string;
  manager: string;
  started: string;
  ended: string;
  issued: string;
  note: string;
  created: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [value, setValue] = useState(0);
  const [business_history, setBusiness_history] = useState<Business_history | null>(null)

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchBusiness_historyDetail();
  }, []);

  const fetchBusiness_historyDetail = async () => {
    try {
      const response = await fetch(`/api/business/${params.id}/history/${params.historyId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사업 히스토리 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setBusiness_history(result.data);
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

  const handleDelete = async () => {
    if (!confirm('정말 이 사업 히스토리를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/business/${params.id}/history?history_id=${params.historyId}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        alert('사업 히스토리가 삭제 되었습니다.');
      } else {
        throw new Error('사업 히스토리 삭제를 실패했습니다.');
      }
  
      router.push(`/business/${params.id}?tab=history`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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

  if (!business_history) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
        <div className="text-gray-500">사업 히스토리를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 히스토리 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push(`/business/${business_history.business_id}/history/${business_history.id}/edit?tab=history`)}
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
            onClick={() => router.push(`/business/${business_history.business_id}?tab=history`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">이슈</h3>
              <p className="mt-1 text-lg text-gray-900">
              {business_history.issue}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">해결방안</h3>
              <p className="mt-1 text-lg text-gray-900">
              {business_history.solution}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">상태</h3>
              <p className="mt-1 text-lg text-gray-900">
              {business_history.status === 'in_progress' ? ('진행중') : business_history.status === 'resolved' ? ('완료') : business_history.status === 'canceled' ? ('취소') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">작업자</h3>
              <p className="mt-1 text-lg text-gray-900">
              {business_history.manager}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발생일</h3>
              <p className="mt-1 text-lg text-gray-900">
              {new Date(business_history.issued).toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">작업시작</h3>
              <p className="mt-1 text-lg text-gray-900">
              {business_history.started}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">작업종료</h3>
              <p className="mt-1 text-lg text-gray-900">
              {business_history.ended}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">비고</h3>
            <p className="mt-1 text-lg text-gray-900">
            {business_history.note}
            </p>
          </div>
          {/* <div>
            <h3 className="text-sm font-medium text-gray-500">등록일</h3>
            <p className="mt-1 text-lg text-gray-900">
            {new Date(business_history.created).toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T')}
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}