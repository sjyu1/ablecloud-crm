'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface BusinessForm {
  id: number;
  name: string;
  issued: string;
  expired: string;
}

export default function BusinessEditPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<BusinessForm | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusinessDetail();
  }, []);

  const fetchBusinessDetail = async () => {
    try {
      const response = await fetch(`/api/business/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사업 정보를 불러올 수 없습니다.');
      }

      setFormData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
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
      const response = await fetch(`/api/business/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('사업이 수정되었습니다.');
      } else {
        throw new Error('사업 수정에 실패했습니다.');
      }

      router.push(`/business/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
      
    setFormData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };

  if (isLoading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  // if (error) {
  //   return <div className="text-center text-red-500 py-4">{error}</div>;
  // }

  if (!formData) {
    return <div className="text-center py-4">사업 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 수정</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업명
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업 시작일
              </label>
              <input
                type="date"
                name="issued"
                value={formData.issued}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업 시작일
              </label>
              <input
                type="date"
                name="expired"
                value={formData.expired}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
              href={`/business/${params.id}`}
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
