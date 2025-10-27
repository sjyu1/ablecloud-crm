'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface CustomerForm {
  id: number;
  name: string;
  telnum: string;
}

interface Props {
  initialData: CustomerForm;
  searchParams: { page?: string; searchField?: string; searchValue?: string };
}

export default function CustomerEditFormClient({ initialData, searchParams }: Props) {
  const router = useRouter();
  const prevPage = searchParams.page || '1';
  const prevSearchField = searchParams.searchField || 'name';
  const prevSearchValue = searchParams.searchValue || '';

  const [formData, setFormData] = useState<CustomerForm>(initialData);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTelnum = (telnum?: string) => {
    if (!telnum) return false;
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(telnum);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!validateTelnum(formData.telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      const response = await fetch(`/api/customer/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('고객이 수정되었습니다.');
        router.push(
          `/customer/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
        );
      } else {
        const data = await response.json();
        throw new Error(data.message || '고객 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '고객 수정에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">회사</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">전화번호 (-포함)</label>
            <input
              type="text"
              name="telnum"
              value={formData.telnum}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-2">
          <Link
            href={`/customer/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
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
  );
}
