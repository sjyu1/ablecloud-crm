'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface SupportForm {
  customer_id: string;
  business_id: string | null;
  issued: string;
  type: string;
  issue: string;
  solution: string;
  actioned: string;
  action_type: string;
  manager: string;
  status: string;
  requester: string;
  requester_telnum: string;
  requester_email: string;
  note: string;
  writer?: string;
}

interface Customer {
  id: number;
  name: string;
}

interface Business {
  id: number;
  name: string;
}

interface Props {
  customers: Customer[];
  role?: string;
  username?: string;
}

export default function SupportRegisterForm({ customers, role, username }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState<SupportForm>({
    customer_id: '',
    business_id: null,
    issued: '',
    type: 'technical',
    issue: '',
    solution: '',
    actioned: '',
    action_type: 'phone',
    manager: '',
    status: 'processing',
    requester: '',
    requester_telnum: '',
    requester_email: '',
    note: '',
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTelnum = (telnum: string) => /^(\d{2,3})-(\d{3,4})-(\d{4})$/.test(telnum);

  const fetchBusiness = async (customer_id: string) => {
    if (!customer_id) return;
    try {
      const response = await fetch(`/api/business?page=1&limit=10000&order=name&customer_id=${customer_id}`);
      const result = await response.json();
      if (result.success) {
        setBusinesses(result.data);
      }
    } catch {
      alert('사업 목록 조회에 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'customer_id') {
      fetchBusiness(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.requester_telnum && !validateTelnum(formData.requester_telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      const body = { ...formData, writer: username };

      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert('기술지원이 등록되었습니다.');
        router.push('/support');
      } else {
        const data = await response.json();
        throw new Error(data.message || '기술지원 등록에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '기술지원 등록에 실패했습니다.';
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
          <label className="block text-sm font-medium text-gray-700 mb-2">고객회사</label>
          <select
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            required
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            {customers.map(item => (
              <option key={item.id} value={item.id.toString()}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">사업</label>
          <select
            name="business_id"
            value={formData.business_id ?? ''}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            {businesses.map(item => (
              <option key={item.id} value={item.id.toString()}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">요청일자</label>
          <input
            type="date"
            name="issued"
            value={formData.issued}
            onChange={handleChange}
            required
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">구분</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="technical">기술지원</option>
            <option value="consult">기술상담</option>
            <option value="incident">장애지원</option>
            <option value="poc">PoC</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">요청내역</label>
          <textarea
            name="issue"
            value={formData.issue}
            onChange={handleChange}
            rows={3}
            placeholder="요청 내용을 입력하세요"
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">처리내역</label>
          <textarea
            name="solution"
            value={formData.solution}
            onChange={handleChange}
            rows={3}
            placeholder="처리 내용을 입력하세요"
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">조치일자</label>
          <input
            type="date"
            name="actioned"
            value={formData.actioned}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">조치방식</label>
          <select
            name="action_type"
            value={formData.action_type}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="phone">유선지원</option>
            <option value="remote">원격지원</option>
            <option value="mail">메일지원</option>
            <option value="site">현장지원</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
          <input
            type="text"
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">완료여부</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="processing">처리중</option>
            <option value="complete">완료</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">요청자</label>
          <input
            type="text"
            name="requester"
            value={formData.requester}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">요청자 전화번호 (- 포함)</label>
          <input
            type="text"
            name="requester_telnum"
            value={formData.requester_telnum}
            onChange={handleChange}
            placeholder="010-1234-5678"
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">요청자 이메일</label>
          <input
            type="email"
            name="requester_email"
            value={formData.requester_email}
            onChange={handleChange}
            placeholder="example@email.com"
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">비고</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={2}
            placeholder="내용을 입력하세요"
            className="w-1/2 px-3 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end space-x-2">
        <Link
          href="/support"
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

