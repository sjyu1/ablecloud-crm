'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface Manager {
  id: number;
  username: string;
  company: string;
  company_id: string;
}

interface CustomerForm {
  name: string;
  telnum: string;
  manager_id: string;
  manager_company_id: string;
}

interface Props {
  managers: Manager[];
  role?: string;
}

export default function CustomerRegisterForm({ managers, role }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    telnum: '',
    manager_id: '',
    manager_company_id: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTelnum = (telnum: string) => {
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(telnum);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'manager_id') {
      const selected = managers.find(m => m.id.toString() === value);
      setFormData(prev => ({
        ...prev,
        manager_id: value,
        manager_company_id: selected?.company_id ?? '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!validateTelnum(formData.telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('고객이 등록되었습니다.');
        router.push('/customer');
      } else {
        const data = await response.json();
        throw new Error(data.message || '고객 등록에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '고객 등록에 실패했습니다.';
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
          <label className="block text-sm font-medium text-gray-700 mb-2">회사</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">전화번호 (- 포함)</label>
          <input
            type="text"
            name="telnum"
            value={formData.telnum}
            onChange={handleChange}
            placeholder="010-1234-5678"
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">고객 관리 파트너 (회사)</label>
          <select
            name="manager_id"
            value={formData.manager_id}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">선택하세요</option>
            {managers.map(manager => (
              <option key={manager.id} value={manager.id.toString()}>
                {manager.username} ({manager.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

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
  );
}
