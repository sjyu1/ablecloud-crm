'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie } from '../../../store/authStore';

interface Partner {
  id: number;
  name: string;
  telnum: string;
  level: string;
  created: string;
}

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const role = getCookie('role');

  useEffect(() => {
    fetchPartnerDetail();
  }, []);

  const fetchPartnerDetail = async () => {
    try {
      const response = await fetch(`/api/partner/${params.id}`);
      const result = await response.json();
      // console.log(response);
      if (!response.ok) {
        throw new Error(result.message || '파트너 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }
      setPartner(result.data);
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
    if (!confirm('정말 이 파트너를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/partner/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('파트너가 삭제되었습니다.');
      } else {
        throw new Error('파트너 삭제에 실패했습니다.');
      }

      router.push('/partner');
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

  if (!partner) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">파트너를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => window.location.href = `/partner/${partner.id}/edit`}
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
            onClick={() => window.location.href = `/partner`}
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
              <h3 className="text-sm font-medium text-gray-500">회사이름</h3>
              <p className="mt-1 text-lg text-gray-900">
              {partner.name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
              <p className="mt-1 text-lg text-gray-900">
              {partner.telnum}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">등급</h3>
              <p className="mt-1 text-lg text-gray-900">
              {partner.level}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">생성일</h3>
              <p className="mt-1 text-lg text-gray-900">{partner.created}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
