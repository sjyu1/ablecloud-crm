'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface PartnerForm {
  id: number;
  name: string;
  telnum: string;
  level: string;
  created: string;
  product_category: string[];
}

interface ProductCategory {
  id: number;
  name: string;
}

interface Props {
  partner: PartnerForm;
  productCategories: ProductCategory[];
  searchParams: { page?: string; level?: string; searchValue?: string };
}

export default function PartnerEditForm({ partner, productCategories, searchParams }: Props) {
  const router = useRouter();
  const prevPage = searchParams.page || '1';
  const prevLevel = searchParams.level || 'PLATINUM';
  const prevSearchValue = searchParams.searchValue || '';

  const [formData, setFormData] = useState<PartnerForm>(partner);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTelnum = (telnum?: string) => {
    if (!telnum) return false;
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(telnum);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!validateTelnum(formData.telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      const formDataToSend = {
        ...formData,
        product_category: formData.product_category.join(','),
      };

      const response = await fetch(`/api/partner/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToSend),
      });

      if (response.ok) {
        alert('파트너가 수정되었습니다.');
        router.push(`/partner/${formData.id}?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '파트너 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '파트너 수정에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      if (!prev) return prev;
      const selected = prev.product_category || [];

      if (!checked && selected.length === 1 && selected.includes(value)) {
        return prev;
      }

      return {
        ...prev,
        product_category: checked
          ? [...selected, value]
          : selected.filter((item) => item !== value),
      };
    });
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">등급</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="PLATINUM">PLATINUM</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="VAR">VAR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제품 카테고리</label>
            <div className="w-1/2 grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md">
              {productCategories.map((item) => (
                <label key={item.id} className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="product_category"
                    value={item.id.toString()}
                    checked={formData.product_category.includes(item.id.toString())}
                    onChange={handleCheckboxGroupChange}
                    className="rounded border-gray-300"
                  />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-2">
          <Link
            href={`/partner/${partner.id}?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`}
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
