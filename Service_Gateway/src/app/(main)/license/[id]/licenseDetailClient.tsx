'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

interface License {
  id: number;
  license_key: string;
  product_id: string;
  product_name: string;
  product_version: string;
  status: string;
  issued: string;
  expired: string;
  issued_user: string;
  company_name: string;
  created: string;
  approve_user: string;
  approved: string;
  business_id: string;
  business_name: string;
  issued_name: string;
  trial: string;
  oem: string;
}

interface Props {
  license: License | null;
  role?: string;
  prevPage: string;
  prevTrial: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function LicenseDetailClient({
  license,
  role,
  prevPage,
  prevTrial,
  prevSearchField,
  prevSearchValue,
}: Props) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('정말 이 라이선스를 승인하시겠습니까?')) return;

    setIsApproving(true);
    try {
      const response = await fetch(`/api/license/${license?.id}/approve`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('라이선스 승인에 실패했습니다.');

      alert('라이선스가 승인되었습니다.');
      router.push(`/license?page=${prevPage}&trial=${prevTrial}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownload = async () => {
    if (!confirm('라이선스를 다운로드 하시겠습니까?')) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/license/${license?.id}/download`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('라이선스 다운로드에 실패했습니다.');

      const blob = await response.blob();
      const uniqueId = uuidv4();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = uniqueId;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 라이선스를 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/license/${license?.id}?business_id=${license?.business_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('라이선스 삭제에 실패했습니다.');

      alert('라이선스가 삭제되었습니다.');
      router.push(`/license?page=${prevPage}&trial=${prevTrial}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이선스 상세정보</h1>
        <div className="space-x-2">
          {role === 'Admin' && license?.status === 'inactive' && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              {isApproving ? '승인 중...' : '승인'}
            </button>
          )}

          {license?.status === 'active' && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              {isDownloading ? '다운로드 중...' : '다운로드'}
            </button>
          )}

          {role === 'Admin' && (
            <>
              <button
                onClick={() =>
                  router.push(
                    `/license/${license?.id}/edit?page=${prevPage}&trial=${prevTrial}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
                  )
                }
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </>
          )}

          <button
            onClick={() =>
              router.push(`/license?page=${prevPage}&trial=${prevTrial}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)
            }
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
              <h3 className="text-sm font-medium text-gray-500">라이선스키</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.license_key}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">제품</h3>
              <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                <a href={`/product/${license?.product_id}`} target="_self" rel="noopener noreferrer">
                  {license?.product_name} (v{license?.product_version})
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">상태</h3>
              <p className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    license?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                {/* <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"> */}
                  {license?.status === 'active' ? '활성' : '비활성'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업</h3>
              <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                <a href={`/business/${license?.business_id}`} target="_self" rel="noopener noreferrer">
                {license?.business_name}
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">시작일</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.issued}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">만료일</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.expired}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발급자</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.issued_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Trial</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.trial == '1' ? 'O' : '-'}</p>
            </div>
            <div className={role === 'Admin' ? '' : 'hidden'}>
              <h3 className="text-sm font-medium text-gray-500">oem</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.oem? license?.oem : 'ABLESTACK'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발급자 회사</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.company_name? license?.company_name : 'ABLECLOUD'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발급일</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.created}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">승인자</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.approve_user? license?.approve_user : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">승인일</h3>
              <p className="mt-1 text-lg text-gray-900">{license?.approved}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
