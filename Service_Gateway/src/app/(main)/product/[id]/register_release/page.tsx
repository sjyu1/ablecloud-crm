'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams, redirect } from 'next/navigation';
import Link from 'next/link';
import {Editor} from "../../../../../components/ui/editor";

interface ProductForm {
  id: number;
  name: string;
  version: string;
  level: string;
  isoFilePath: string;
  category_id: number;
}

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const prevSearchValue = searchParams.get('searchValue') || '';
  const prevEnableList = searchParams.get('enablelist') || '';
  const [formData, setFormData] = useState<ProductForm | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState('');


  useEffect(() => {
    fetchProductDetail();
  }, []);

  const fetchProductDetail = async () => {
    try {
      const response = await fetch(`/api/product/${params.id}/release`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '릴리즈노트 정보를 불러올 수 없습니다.');
      }

      setFormData(result.data.data);

      // Editor 값 세팅
      if (result.data.data?.contents) {
        setValue(result.data.data.contents);
      }
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
      const response = await fetch(`/api/product/${params.id}/release`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('릴리즈노트가 등록되었습니다.');
        router.push(`/product/${params.id}?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${prevEnableList}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '릴리즈노트 수정에 실패했습니다.');
      }

      router.push(`/product/${params.id}?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${prevEnableList}`);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
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

  const handleEditorChange = (newValue: string | undefined) => {
    setValue(newValue ?? '');

    setFormData((prev) => prev ? { ...prev, contents: newValue ?? '' } : null);
  };

  if (isLoading) {
    return <div className="text-center py-4 text-sm">로딩 중...</div>;
  }

  // if (error) {
  //   return <div className="text-center text-red-500 py-4">{error}</div>;
  // }

  if (!formData) {
    return <div className="text-center py-4 text-sm">릴리즈노트 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">릴리즈노트 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Editor
                value={value}
                onChange={handleEditorChange}
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
              href={`/product/${params.id}?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${prevEnableList}`}
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
              {isLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
