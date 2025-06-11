'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../../../../store/authStore';
import Link from 'next/link';

interface Business_history {
  issue: string;
  solution: string;
  status: string;
  manager: string;
  issued: string;
  started: string;
  ended: string;
  note: string;
}

export default function BusinessHistoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const [formData, setFormData] = useState<Business_history | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchBusiness_historyDetail();
  }, []);

  const fetchBusiness_historyDetail = async () => {
    try {
      const response = await fetch(`/api/business/${params.id}/history/${params.historyId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사업 히스토리 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setFormData(result.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // setIsLoading(true);

    if (!formData) {
      setError('유효하지 않은 데이터입니다.');
      return;
    }

    try {
      const formattedIssued = formData.issued ? new Date(formData.issued).toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T'): '';
      const updateFormData = { 
        ...formData,
        issued: formattedIssued
      }
      const response = await fetch(`/api/business/${params.id}/history/${params.historyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('사업 히스토리가 수정 되었습니다.');
      } else {
        throw new Error('사업 히스토리 수정을 실패했습니다.');
      }

      router.push(`/business/${params.id}/history/${params.historyId}?tab=history`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
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

  if (isLoading) {
    return <div className="text-center py-4 text-sm">로딩 중...</div>;
  }

  // if (error) {
  //   return <div className="text-center text-red-500 py-4">{error}</div>;
  // }

  if (!formData) {
    return <div className="text-center py-4 text-sm">사업 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 수정</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이슈
              </label>
              <textarea
                  id="text-input"
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  placeholder="내용을 입력하세요"
                  rows={2}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                해결방안
              </label>
              <textarea
                  id="text-input"
                  name="solution"
                  value={formData.solution}
                  onChange={handleChange}
                  placeholder="내용을 입력하세요"
                  rows={2}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="in_progress">진행중</option>
                <option value="resolved">완료</option>
                <option value="canceled">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업자
              </label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발생일
              </label>
              <input
                type="datetime-local"
                name="issued"
                value={formData.issued ? new Date(formData.issued).toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T'): ''}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업 시작일
              </label>
              <input
                type="date"
                name="started"
                value={formData.started}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업 종료일
              </label>
              <input
                type="date"
                name="ended"
                value={formData.ended}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고
              </label>
              <textarea
                  id="text-input"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="내용을 입력하세요"
                  rows={2}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              href={`/business/${params.id}?tab=history`}
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
    </div>
  );
}