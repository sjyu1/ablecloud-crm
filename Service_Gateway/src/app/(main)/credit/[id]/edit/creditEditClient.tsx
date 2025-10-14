'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
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

interface Props {
  initialData: CreditForm;
  searchParams: { page?: string; searchField?: string; searchValue?: string };
}

export default function CreditEditClient({ initialData, searchParams }: Props) {
  const router = useRouter();

  const prevPage = searchParams.page || '1';
  const prevSearchField = searchParams.searchField || 'type';
  const prevSearchValue = searchParams.searchValue || '';

  const [formData, setFormData] = useState<CreditForm>(initialData);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'deposit' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/credit/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('크레딧이 수정되었습니다.');
        router.push(
          `/credit/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
        );
      } else {
        const data = await response.json();
        throw new Error(data.message || '크레딧 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '크레딧 수정에 실패했습니다.';
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
            <h3 className="text-sm font-medium text-gray-500">파트너</h3>
            <p className="mt-1 text-lg text-gray-900">{formData.partner}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">사업</h3>
            <p className="mt-1 text-lg text-gray-900">
              {formData.business || '-'}
            </p>
          </div>

          {formData.deposit != null && (
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
          )}

          {formData.credit ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500">사용 크레딧</h3>
              <p className="mt-1 text-lg text-gray-900">{formData.credit}</p>
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

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-2">
          <Link
            href={`/credit/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
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
