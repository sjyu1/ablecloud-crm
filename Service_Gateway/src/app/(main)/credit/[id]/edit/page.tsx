'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../../store/authStore';
import Link from 'next/link';

interface CreditForm {
  id: number;
  partner_id: string;
  partner: string;
  business_id: string;
  business: string;
  deposit: number;
  credit: number;
  note: string;
}

export default function CreditEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const prevSearchField = searchParams.get('searchField') || 'type';
  const prevSearchValue = searchParams.get('searchValue') || '';
  const [formData, setFormData] = useState<CreditForm | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreditDetail();
  }, []);

  const fetchCreditDetail = async () => {
    try {
      const response = await fetch(`/api/credit/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.message == 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        } else {
          // alert(result.message);
          return;
        }
      }

      setFormData(result.data);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert('크레딧 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // setIsLoading(true);

    try {
      const updateFormData = { ...formData}
      const response = await fetch(`/api/credit/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('크레딧이 수정되었습니다.');
      } else {
        throw new Error(response.status == 409? '이미 존재하는 크레딧입니다.' : '크레딧 수정에 실패했습니다.');
      }

      router.push(`/credit/${params.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
      
    setFormData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };

  if (isLoading) {
    return <div className="text-center py-4 text-sm">로딩 중...</div>;
  }

  // if (error) {
  //   return <div className="text-center text-red-500 py-4">{error}</div>;
  // }

  if (!formData) {
    return <div className="text-center py-4 text-sm">크레딧 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">크레딧 수정</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">파트너</h3>
              <p className="mt-1 text-lg text-gray-900">
                {formData.partner}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업</h3>
              <p className="mt-1 text-lg text-gray-900">
                {formData.business? formData.business : '-'}
              </p>
            </div>
            {formData.deposit ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                구매 크레딧
              </label>
              <input
                type="number"
                name="deposit"
                min="0"
                value={formData.deposit}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            ) : null}
            {formData.credit ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500">사용 크레딧</h3>
              <p className="mt-1 text-lg text-gray-900">
                {formData.credit}
              </p>
            </div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고
              </label>
              <textarea
                  id="text-input"
                  name="note"
                  value={formData.note ?? ''}
                  onChange={handleChange}
                  placeholder="내용을 입력하세요"
                  rows={2}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href={`/credit/${params.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? '처리 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
