'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

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
}

export default function LicenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [license, setLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchLicenseDetail();
  }, []);

  const fetchLicenseDetail = async () => {
    try {
      const response = await fetch(`/api/license/${params.id}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || '라이센스 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setLicense(result.data);
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

  const handleApprove = async () => {
    if (!confirm('정말 이 라이센스를 승인하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/license/${params.id}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('라이센스가 승인되었습니다.');
      } else {
        throw new Error('라이센스 승인에 실패했습니다.');
      }

      router.push(`/license`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
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

      // 파일명을 위한 UUID 생성
      const uniqueId = uuidv4();

      // 확장자 없이 파일생성
      const blob = new Blob([await response.blob()], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${uniqueId}`;
      link.click();

    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 라이센스를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/license/${params.id}?business_id=${license?.business_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('라이센스가 삭제되었습니다.');
      } else {
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
            onClick={handleApprove}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            style={{ display: role === 'Admin'&& license.status === 'inactive' ? '' : 'none' }}
          >
            승인
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            style={{ display: license.status === 'active' ? '' : 'none' }}
          >
            다운로드
          </button>
          <button
            onClick={() => window.location.href = `/license/${license.id}/edit`}
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
              {license.product_name} (v{license.product_version})
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">상태</h3>
              <p className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    license.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                {/* <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"> */}
                  {license.status === 'active' ? '활성' : '비활성'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업명</h3>
              <p className="mt-1 text-lg text-gray-900">
              {license.business_name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">시작일</h3>
              <p className="mt-1 text-lg text-gray-900">{license.issued}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">만료일</h3>
              <p className="mt-1 text-lg text-gray-900">{license.expired}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발급자</h3>
              <p className="mt-1 text-lg text-gray-900">{license.issued_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Trial</h3>
              <p className="mt-1 text-lg text-gray-900">{license.trial == '1' ? 'O' : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발급자 회사명</h3>
              <p className="mt-1 text-lg text-gray-900">{license.company_name? license.company_name : 'ABLECLOUD'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">발급일</h3>
              <p className="mt-1 text-lg text-gray-900">{format(license.created, 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">승인자</h3>
              <p className="mt-1 text-lg text-gray-900">{license.approve_user? license.approve_user : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">승인일</h3>
              <p className="mt-1 text-lg text-gray-900">{format(license.approved, 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
