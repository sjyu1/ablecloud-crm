'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PartnerForm {
  id: number;
  name: string;
  telnum: string;
  level: string;
}

interface User {
  id: string,
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  type: string;
  telnum:string;
  role: string;
}

export default function PartnerRegisteruserPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [users, setUsers,] = useState<User[]>([]);
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetchPartnerDetail();
  }, []);

  const fetchPartnerDetail = async () => {
    try {
      const response = await fetch(`/api/user?type=partner`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사용자 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setUsers(result.data);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
      return;
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
      const response = await fetch(`/api/partner/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('파트너가 수정되었습니다.');
      } else {
        throw new Error('파트너 수정에 실패했습니다.');
      }

      router.push(`/partner/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
      
    setFormData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };
  
  const [majorCheckedList, setMajorCheckedList] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const handleCheckedMajor = (value: string, isChecked: boolean) => {
    if (isChecked) {
      setMajorCheckedList((prev) => [...prev, value]);
      return;
    }
    if (!isChecked && majorCheckedList.includes(value)) {
      setMajorCheckedList(majorCheckedList.filter((item) => item !== value));
      return;
    }
    return;
  };

  const handleOnChangeCheckMajor =
  (e: ChangeEvent<HTMLInputElement>, value: string) => {
    setIsChecked(!isChecked);
    handleCheckedMajor(value, e.target.checked);
  }

  if (isLoading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  // if (error) {
  //   return <div className="text-center text-red-500 py-4">{error}</div>;
  // }

  // if (!formData) {
  //   return <div className="text-center py-4">파트너 정보를 찾을 수 없습니다.</div>;
  // }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 담당자 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자 이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                성
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                타입
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                role
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/user/${user.id}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                <input type='checkbox' id='major'
                  onChange={(e) => handleOnChangeCheckMajor(e, user)} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.username}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.firstName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  사용자 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href={`/partner/${params.id}`}
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
