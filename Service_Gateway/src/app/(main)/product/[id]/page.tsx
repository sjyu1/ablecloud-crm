'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie } from '../../../store/authStore';
import { format } from 'date-fns';

interface Product {
  id: number;
  name: string;
  isoFilePath: string;
  version: string;
  created: string;
}

export default function ProductDetailPage() {
  const { id } = useParams(); // 더 깔끔하게 구조분해
  const router = useRouter();

  const [state, setState] = useState<{
    loading: boolean;
    product: Product | null;
    error: string;
    role?: string;
  }>({
    loading: true,
    product: null,
    error: '',
    role: undefined,
  });

  useEffect(() => {
    const roleFromCookie = getCookie('role');

    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`/api/product/${id}`);
        const result = await response.json();

        if (!response.ok || result.data?.error) {
          throw new Error(result.message || result.data?.message || '제품 정보를 불러올 수 없습니다.');
        }

        setState(prev => ({
          ...prev,
          product: result.data,
          role: roleFromCookie ?? undefined,
          loading: false,
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : '오류가 발생했습니다.',
          role: roleFromCookie ?? undefined,
          loading: false,
        }));
        alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
      }
    };

    fetchProductDetail();
  }, [id]);

  const { product, loading, error, role } = state;

  const handleDelete = async () => {
    if (!confirm('정말 이 제품을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/product/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('제품 삭제에 실패했습니다.');
      alert('제품이 삭제되었습니다.');
      router.push('/product');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDisabled = async () => {
    if (!confirm('정말 이 제품을 비활성화 하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/product/${id}/disabled`, { method: 'PUT' });
      if (!res.ok) throw new Error('제품 비활성화에 실패했습니다.');
      alert('제품이 비활성화 되었습니다.');
      router.push('/product');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center items-center h-64">
        {error || '제품을 찾을 수 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 상세정보</h1>
        <div className="space-x-2">
          {role === 'Admin' && (
            <>
              <button onClick={handleDisabled} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">제품 비활성화</button>
              <button onClick={() => router.push(`/product/${product.id}/edit`)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">수정</button>
              <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">삭제</button>
            </>
          )}
          <button onClick={() => router.push('/product')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">목록</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">제품명</h3>
          <p className="mt-1 text-lg text-gray-900">{product.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">제품버전</h3>
          <p className="mt-1 text-lg text-gray-900">{product.version}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">제품 다운로드</h3>
          <p className="mt-1 text-lg text-blue-600 hover:text-blue-800 transition">
            <a href={`/iso${product.isoFilePath}`} target="_self">[ 다운로드 ]</a>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">생성일</h3>
          <p className="mt-1 text-lg text-gray-900">
            {format(product.created, 'yyyy-MM-dd HH:mm:ss')}
          </p>
        </div>
      </div>
    </div>
  );
}