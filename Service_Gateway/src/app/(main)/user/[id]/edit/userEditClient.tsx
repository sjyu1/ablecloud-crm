'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';

interface UserForm {
  id: string;
  username: string;
  email: string;
  firstName: string;
  type: string;
  telnum: string;
  role: string;
  company_id: string;
}

interface UserEditClientProps {
  user: UserForm;
  prevPage: string;
  prevType: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function UserEditClient({
  user,
  prevPage,
  prevType,
  prevSearchField,
  prevSearchValue,
}: UserEditClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserForm>(user);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('사용자가 수정되었습니다.');
        router.push(
          `/user/${user.id}?page=${prevPage}&type=${prevType}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
        );
      } else {
        const data = await response.json();
        throw new Error(data.message || '사용자 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용자 수정에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
            <input
              type="text"
              name="telnum"
              value={formData.telnum}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/user/${user.id}?page=${prevPage}&type=${prevType}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
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
  );
}
