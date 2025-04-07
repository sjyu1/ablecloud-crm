'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserForm {
  username: string;
  password: string;
  passwordCheck: string;
  firstName: string;
  lastName: string;
  email: string;
  telnum: string;
  role: string;
  type: string;
  company_id: string;
}

interface Company {
  id: number;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UserRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<UserForm>({
    username: '',
    password: '',
    passwordCheck: '',
    firstName: '',
    lastName: '',
    email: '',
    telnum: '',
    role: 'User',
    type: '',
    company_id: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [company, setCompany] = useState<Company[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 패스워드 밸리데이션
      if (!validatePassword(formData.password)) {
        throw new Error('비밀번호는 8자 이상이어야 하며, 대문자/소문자/특수문자/숫자를 모두 포함해야 합니다.');
      }

      // 패스워드 확인
      if (formData.password !== formData.passwordCheck) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      setIsLoading(true);
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('사용자가 등록되었습니다.');
      } else {
        const err = await response.json();
        throw new Error(err.message);
      }

      router.push('/user');
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    //type에 따른 company 목록조회
    if (e.target.value == 'partner' || e.target.value == 'customer') {
      fetchCompanyDetail(e.target.value);
    } else {
      const test: Company = {
        id: 1,
        name: "ABLECLOUD"
      };
      setCompany([test]);
    }
  };

  const fetchCompanyDetail = async (type: string) => {
    try {
        const response = await fetch(`/api/${type}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || type+' 정보를 불러올 수 없습니다.');
        }

        if (result.data.error) {
          setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
          // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        }

        setCompany(result.data);
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password: string) => {
    const regex = {
      minLength: /.{8,}/, // 8자 이상
      hasNumber: /[0-9]/, // 숫자 포함
      hasUpperCase: /[A-Z]/, // 대문자 포함
      hasLowerCase: /[a-z]/, // 소문자 포함
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/, // 특수문자 포함
    };

    if (!regex.minLength.test(password) || !regex.hasNumber.test(password) || !regex.hasUpperCase.test(password) || !regex.hasLowerCase.test(password) || !regex.hasSpecialChar.test(password)) {
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사용자 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
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
            <div>
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
            </div>
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
                <option value="Admin">Admin</option>
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
                <option value="vendor">vendor</option>
                <option value="partner">partner</option>
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
                {company.map(item => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.name}
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
      </div>
    </div>
  );
} 
