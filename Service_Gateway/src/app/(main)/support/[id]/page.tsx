'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';

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
  note: string;
}

export default function supportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [support, setSupport] = useState<Support | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const prevPage = searchParams.get('page') || '1';

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchsupportDetail();
  }, []);

  const fetchsupportDetail = async () => {
    try {
      const response = await fetch(`/api/support/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '기술지원 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setSupport(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      // if (err instanceof Error) {
      //   if (err.message == 'Failed to fetch user information') {
      //     logoutIfTokenExpired(); // 토큰 만료시 로그아웃
      //   }
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 기술지원을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/support/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('기술지원이 삭제되었습니다.');
      } else {
        throw new Error('기술지원 삭제에 실패했습니다.');
      }

      router.push(`/support?page=${prevPage}`);
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

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!support) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">기술지원을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">기술지원 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push(`/support/${support.id}/edit?page=${prevPage}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/support?page=${prevPage}`)}
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
              <h3 className="text-sm font-medium text-gray-500">고객회사</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.customer}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업명</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.business}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청일자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.issued}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">구분</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.type === 'consult' ? ('기술상담') : support.type === 'technical' ? ('기술지원') : support.type === 'incident' ? ('장애지원') : support.type === 'poc' ? ('PoC') : support.type === 'other' ? ('기타') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청내역</h3>
              <p className="mt-1 text-lg text-gray-900 whitespace-pre-line">
                {support.issue}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">처리내역</h3>
              <p className="mt-1 text-lg text-gray-900 whitespace-pre-line">
                {support.solution}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">조치일자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.actioned}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">조치방식</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.action_type === 'phone' ? ('유선지원') : support.action_type === 'remote' ? ('원격지원') : support.action_type === 'mail' ? ('메일지원') : support.action_type === 'site' ? ('현장지원') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">담당자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.manager}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">완료여부</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.status === 'processing' ? ('처리중') : support.status === 'complete' ? ('완료') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.requester}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청자 전화번호</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support.requester_telnum}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">비고</h3>
              <textarea
                id="text-input"
                name="note"
                value={support.note ?? ''}
                rows={5}
                readOnly
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {/* <p className="mt-1 text-lg text-gray-900">
                {support.details}
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}