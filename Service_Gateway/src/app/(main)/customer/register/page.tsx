'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import Link from 'next/link';

interface CustomerForm {
  name: string;
  telnum: string;
  manager_id: string;
}

interface Manager {
  id: number;
  username: string;
  company: string;
}

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    telnum: '',
    manager_id: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    const fetchManagers = async () => {
      try {
        let url = `/api/user/forCreateManager`;

        if (role == 'User') {
          url += `?role=User`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
          if (result.message == 'Failed to fetch user information') {
            logoutIfTokenExpired(); // 토큰 만료시 로그아웃
          } else {
            // alert(result.message);
            return;
          }
        }

        setManagers(result.data);
      } catch (error) {
        alert('사업담당자 목록 조회에 실패했습니다.');
      }
    };

    fetchManagers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('고객이 등록되었습니다.');
      } else {
        throw new Error(response.status == 409? '이미 존재하는 회사이름입니다.' : '고객 등록에 실패했습니다.');
      }

      router.push('/customer');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">고객 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                회사이름
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
                전화번호 (-포함)
              </label>
              <input
                type="text"
                name="telnum"
                value={formData.telnum}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객 관리 파트너 (회사)
              </label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {managers.map(item => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.username} ({item.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href="/customer"
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
      </div>
    </div>
  );
} 
