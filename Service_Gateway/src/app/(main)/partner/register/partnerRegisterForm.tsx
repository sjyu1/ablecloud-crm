'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface PartnerForm {
  name: string;
  telnum: string;
  level: string;
  productCategoryIds: number[];
}

interface ProductCategory {
  id: number;
  name: string;
}

interface Props {
  categories: ProductCategory[];
}

export default function PartnerRegisterForm({ categories }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<PartnerForm>({
    name: '',
    telnum: '',
    level: 'PLATINUM',
    productCategoryIds: Array.isArray(categories) && categories.length > 0
    ? [categories[0].id]
    : [],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTelnum = (telnum: string) => {
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(telnum);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'level' ? value : value,
    }));
  };

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const id = Number(value);
    setFormData(prev => {
      const selected = prev.productCategoryIds || [];
      if (!checked && selected.length === 1 && selected.includes(id)) {
        return prev; // 최소 1개는 선택된 상태 유지
      }
      return {
        ...prev,
        productCategoryIds: checked
          ? [...selected, id]
          : selected.filter(item => item !== id),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!validateTelnum(formData.telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      if (formData.productCategoryIds.length === 0) {
        throw new Error('제품 카테고리를 최소 1개 이상 선택해야 합니다.');
      }

      const body = {
        ...formData,
        product_category: formData.productCategoryIds.join(','),
      };

      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert('파트너가 등록되었습니다.');
        router.push('/partner');
      } else {
        const data = await response.json();
        throw new Error(data.message || '파트너 등록에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '파트너 등록에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <label className="block text-sm font-medium text-gray-700 mb-2">전화번호 (- 포함)</label>
          <input
            type="text"
            name="telnum"
            value={formData.telnum}
            onChange={handleChange}
            placeholder="010-1234-5678"
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
          <div className="w-1/2 grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
            {categories.map(item => (
              <label key={item.id} className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="product_category"
                  value={item.id}
                  checked={formData.productCategoryIds.includes(item.id)}
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
          href="/partner"
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
          {isLoading ? '처리 중...' : '등록'}
        </button>
      </div>
    </form>
  );
}
