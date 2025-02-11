'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface License {
  id: number;
  license_key: string;
  product_id: string;
  status: string;
  type: string;
  core: string;
  issued_date: string;
  expiry_date: string;
}

export default function LicenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [license, setLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLicenseDetail();
  }, []);

  const fetchLicenseDetail = async () => {
    try {
      const response = await fetch(`/api/license/${params.id}`);
      const result = await response.json();
      // console.log(response);
      if (!response.ok) {
        throw new Error(result.message || '라이센스 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }
      setLicense(result.data);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!confirm('라이센스를 다운로드 하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/license/${params.id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('라이센스 다운로드에 실패했습니다.');
      }

      // 응답을 blob으로 변환
      const blob = await response.blob();
      
      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license_${license?.license_key}.lic`; // 파일명 설정
      
      // 링크 클릭하여 다운로드 실행
      document.body.appendChild(a);
      a.click();
      
      // cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 라이센스를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/license/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('라이센스 삭제에 실패했습니다.');
      }

      router.push('/license');
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

  if (!license) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">라이센스를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이센스 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            다운로드
          </button>
          <button
            onClick={() => window.location.href = `/license/${license.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            삭제
          </button>
          <button
            onClick={() => window.location.href = `/license`}
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
              <h3 className="text-sm font-medium text-gray-500">라이센스키</h3>
              <p className="mt-1 text-lg text-gray-900">{license.license_key}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">제품명</h3>
              <p className="mt-1 text-lg text-gray-900">
              {license.product_id}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">상태</h3>
              <p className="mt-1">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {license.status}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">제품유형</h3>
              <p className="mt-1 text-lg text-gray-900">
              {license.type === 'vm' ? ('ABLESTACK VM') : license.type === 'hci' ? ('ABLESTACK HCI') : license.type === 'vm_beta' ? ('ABLESTACK VM - Beta'): license.type === 'hci_beta' ? ('ABLESTACK VM - Beta'): ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">코어수</h3>
              <p className="mt-1 text-lg text-gray-900">
              {license.core}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">시작일</h3>
              <p className="mt-1 text-lg text-gray-900">{license.issued_date}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">만료일</h3>
              <p className="mt-1 text-lg text-gray-900">{license.expiry_date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
