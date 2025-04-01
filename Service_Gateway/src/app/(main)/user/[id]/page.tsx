'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie } from '../../../store/authStore';

interface User {
  id: string,
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  type: string;
  telnum:string;
  role: string;
  company: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const role = getCookie('role');

  useEffect(() => {
    fetchUserDetail();
  }, []);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/api/user/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사용자 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }
      setUser(result.data);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('사용자가 삭제되었습니다.');
      } else {
        throw new Error('사용자 삭제에 실패했습니다.');
      }

      router.push('/user');
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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">사용자를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사용자 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => window.location.href = `/user/${user.id}/edit`}
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
            onClick={() => window.location.href = `/user`}
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
              <h3 className="text-sm font-medium text-gray-500">사용자 이름</h3>
              <p className="mt-1 text-lg text-gray-900">{user.username}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">이메일</h3>
              <p className="mt-1 text-lg text-gray-900">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">이름</h3>
              <p className="mt-1 text-lg text-gray-900">{user.firstName}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">성</h3>
              <p className="mt-1 text-lg text-gray-900">{user.lastName}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
              <p className="mt-1 text-lg text-gray-900">{user.telnum}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">타입</h3>
              <p className="mt-1 text-lg text-gray-900">{user.attributes.type}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">ROLE</h3>
              <p className="mt-1 text-lg text-gray-900">{user.role}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">회사이름</h3>
              <p className="mt-1 text-lg text-gray-900">{user.company}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
