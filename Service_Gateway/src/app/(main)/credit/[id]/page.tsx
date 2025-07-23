'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';

interface Credit {
  id: string;
  partner_id: string;
  partner: string;
  business_id: string;
  business: string;
  deposit: string;
  credit: string;
  note: string;
  created: string;
  deposit_use: string;
}

export default function creditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [credit, setCredit] = useState<Credit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const prevPage = searchParams.get('page') || '1';
  const prevSearchField = searchParams.get('searchField') || 'type';
  const prevSearchValue = searchParams.get('searchValue') || '';
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchcreditDetail = async () => {
      try {
        const response = await fetch(`/api/credit/${params.id}`, { signal });
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.message || '크레딧 정보를 불러올 수 없습니다.');
        }
  
        if (result.data.error) {
          throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        }
  
        setCredit(result.data);
      } catch (err) {
        if ((err as any).name === 'AbortError') return;
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

    fetchcreditDetail();

    return () => controller.abort();
  }, []);


  const handleDelete = async () => {
    if (!confirm('정말 이 크레딧을 삭제하시겠습니까?')) {
      return;
    }

    // 구매 크레딧 삭제시
    if (credit?.deposit_use == '1') {
      if (!confirm('해당 크레딧이 사용되었습니다. 정말 이 크레딧을 삭제하시겠습니까?')) {
        return;
      }
    }

    // 사용 크레딧 삭제시
    if (credit?.business) {
      alert('크레딧에 대한 사업이 존재합니다. 사업을 삭제하세요.');
      return;
    }

    try {
      const response = await fetch(`/api/credit/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('크레딧이 삭제되었습니다.');
      } else {
        throw new Error('크레딧 삭제에 실패했습니다.');
      }

      router.push(`/credit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
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

  if (!credit) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">크레딧을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">크레딧 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push(`/credit/${credit.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
            // className={credit.deposit ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
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
            onClick={() => router.push(`/credit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
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
              <h3 className="text-sm font-medium text-gray-500">파트너</h3>
              <p className="mt-1 text-lg text-gray-900">
                <a href={`/partner/${credit.partner_id}`} target="_self" rel="noopener noreferrer">
                  {credit.partner}
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업</h3>
              <p className="mt-1 text-lg text-gray-900">
                <a href={`/business/${credit.business_id}`} target="_self" rel="noopener noreferrer">
                  {credit.business? credit.business : '-'}
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">구매 크레딧</h3>
              <p className="mt-1 text-lg text-gray-900">
                {credit.deposit? credit.deposit : '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사용 크레딧</h3>
              <p className="mt-1 text-lg text-gray-900">
                {credit.credit? credit.credit : '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">비고</h3>
              <textarea
                id="text-input"
                name="note"
                value={credit.note ?? ''}
                rows={5}
                readOnly
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {/* <p className="mt-1 text-lg text-gray-900">
                {credit.details}
              </p> */}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">생성일</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(credit.created, 'yyyy-MM-dd HH:mm:ss')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}