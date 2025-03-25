'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie } from '../../../store/authStore';
import { format } from 'date-fns';

interface Business {
  id: number;
  name: string;
  issued: string;
  expired: string;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const role = getCookie('role');

  useEffect(() => {
    fetchBusinessDetail();
  }, []);

  const fetchBusinessDetail = async () => {
    try {
      const response = await fetch(`/api/business/${params.id}`);
      const result = await response.json();
      // console.log(response);
      if (!response.ok) {
        throw new Error(result.message || '사업 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }
      setBusiness(result.data);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 사업을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/business/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('사업이 삭제되었습니다.');
      } else {
        throw new Error('사업 삭제에 실패했습니다.');
      }

      router.push('/business');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
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

  if (!business) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">사업을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => window.location.href = `/business/${business.id}/edit`}
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
            onClick={() => window.location.href = `/business`}
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
              <h3 className="text-sm font-medium text-gray-500">사업명</h3>
              <p className="mt-1 text-lg text-gray-900">
                {business.name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업 시작일</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(business.issued, 'yyyy-MM-dd')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업 종료일</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(business.expired, 'yyyy-MM-dd')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
