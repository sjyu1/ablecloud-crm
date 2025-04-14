'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';

interface Product {
  id: number;
  name: string;
  // rpmFilePath: string;
  isoFilePath: string;
  version: string;
  created: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchProductDetail();
  }, []);

  const fetchProductDetail = async () => {
    try {
      const response = await fetch(`/api/product/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '제품 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setProduct(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      if (err instanceof Error) {
        if (err.message == 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisabled = async () => {
    if (!confirm('정말 이 제품을 비활성화 하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/product/${params.id}/disabled`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('제품이 비활성화 되었습니다.');
      } else {
        throw new Error('제품 비활성화에 실패했습니다.');
      }

      router.push(`/product`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 제품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/product/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('제품이 삭제되었습니다.');
      } else {
        throw new Error('제품 삭제에 실패했습니다.');
      }

      router.push('/product');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
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

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">제품을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={handleDisabled}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            제품 비활성화
          </button>
          <button
            onClick={() => window.location.href = `/product/${product.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            삭제
          </button>
          <button
            onClick={() => window.location.href = `/product`}
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
              <h3 className="text-sm font-medium text-gray-500">제품명</h3>
              <p className="mt-1 text-lg text-gray-900">
              {product.name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">제품버전</h3>
              <p className="mt-1 text-lg text-gray-900">
              {product.version}
              </p>
            </div>
            {/* <div>
              <h3 className="text-sm font-medium text-gray-500">제품 ISO경로</h3>
              <p className="mt-1 text-lg text-gray-900">
                {product.isoFilePath}
              </p>
            </div> */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">제품 다운로드</h3>
              <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                <a href={"/iso"+product.isoFilePath} target="_self" rel="noopener noreferrer">
                  [ 다운로드 ]
                </a>
              </p>
            </div>
            {/* <div>
              <h3 className="text-sm font-medium text-gray-500">제품 RPM경로</h3>
              <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                <a href={product.rpmFilePath} target="_blank" rel="noopener noreferrer">
                  {product.rpmFilePath}
                </a>
              </p>
            </div> */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">생성일</h3>
              <p className="mt-1 text-lg text-gray-900">{format(product.created, 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}