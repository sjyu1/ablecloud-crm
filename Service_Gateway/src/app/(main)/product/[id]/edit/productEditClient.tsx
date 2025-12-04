'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';

interface ProductForm {
  id: number;
  name: string;
  version: string;
  level?: string;
  isoFilePath: string;
  checksum: string;
  category_id: number;
}

interface ProductCategory {
  id: number;
  name: string;
}

interface ProductEditClientProps {
  product: ProductForm;
  productCategory: ProductCategory[];
  prevPage: string;
  prevSearchValue: string;
  enablelist: string;
}

export default function ProductEditClient({
  product,
  productCategory,
  prevPage,
  prevSearchValue,
  enablelist,
}: ProductEditClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductForm>(product);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/product/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('제품이 수정되었습니다.');
        router.push(`/product/${product.id}?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${enablelist}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '제품 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '제품 수정에 실패했습니다.';
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
      [name]: name === 'category_id' ? Number(value) : value,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제품
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
              제품 카테고리
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              {productCategory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제품버전
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제품 ISO경로
            </label>
            <input
              type="text"
              name="isoFilePath"
              value={formData.isoFilePath}
              onChange={handleChange}
              placeholder="/v4.3.0/ABLESTACK-Diplo-v4.3.0.iso"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제품 checksum (MD5)
            </label>
            <input
              type="text"
              name="checksum"
              value={formData.checksum}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div> */}
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() =>
              router.push(`/product/${product.id}?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${enablelist}`)
            }
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
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
