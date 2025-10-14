'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface UserFormProps {
  role?: string;
}

interface Company {
  id: number;
  name: string;
}

export default function UserRegisterForm({ role }: UserFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordCheck: '',
    firstName: '',
    email: '',
    telnum: '',
    role: 'User',
    type: '',
    company_id: '',
  });

  const [company, setCompanies] = useState<Company[]>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    const regex = {
      minLength: /.{8,}/,
      hasNumber: /[0-9]/,
      hasUpperCase: /[A-Z]/,
      hasLowerCase: /[a-z]/,
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>-_]/,
    };
    return Object.values(regex).every((r) => r.test(password));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (value === 'partner' || value === 'customer') {
      try {
        const res = await fetch(`/api/${value}?page=1&limit=10000&order=name`);
        const result = await res.json();

        if (res.ok) {
          setCompanies(result.data || []);
        } else {
          alert(result.message || `${value} 목록을 불러오지 못했습니다.`);
        }
      } catch (err) {
        alert('회사 목록 로딩 중 오류가 발생했습니다.');
      }
    } else {
      setCompanies([{ id: 1, name: 'ABLECLOUD' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.type !== 'customer') {
        if (!validatePassword(formData.password)) {
          throw new Error('비밀번호는 8자 이상, 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.');
        }

        if (formData.password !== formData.passwordCheck) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
      }

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('사용자가 등록되었습니다.');
        router.push('/user');
      } else {
        const result = await res.json();
        throw new Error(result.message || '사용자 등록에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용자 등록에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {role == 'Admin' && <option value="Admin">Admin</option>}
                <option value="User">User</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleSelectChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {role == 'Admin' && <option value="vendor">vendor</option>}
                {role == 'Admin' && <option value="partner">partner</option>}
                <option value="customer">customer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                company
              </label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {company?.map(item => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {formData.type !== 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 (비밀번호는 8자 이상, 대문자/소문자/특수문자/숫자를 모두 포함)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
            {formData.type !== 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  name="passwordCheck"
                  value={formData.passwordCheck}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
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
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href="/user"
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
  );
}
