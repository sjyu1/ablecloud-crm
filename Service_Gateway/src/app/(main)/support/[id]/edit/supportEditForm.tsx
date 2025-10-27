'use client';

import { useState, useEffect } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface SupportForm {
  id: number;
  customer_id: string;
  business_id: string;
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
}

interface Customer {
  id: number;
  name: string;
  telnum: string;
}

interface Business {
  id: number;
  name: string;
}

interface Props {
  initialData: SupportForm;
  customers: Customer[];
  businesses: Business[];
  role?: string;
  searchParams: { page?: string; searchField?: string; searchValue?: string };
}

export default function SupportEditFormClient({
  initialData,
  customers,
  businesses: initialBusinesses,
  role,
  searchParams,
}: Props) {
  const router = useRouter();

  const prevPage = searchParams.page || '1';
  const prevSearchField = searchParams.searchField || 'name';
  const prevSearchValue = searchParams.searchValue || '';

  const [formData, setFormData] = useState<SupportForm>(initialData);
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTelnum = (telnum?: string) => {
    if (!telnum) return true;
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(telnum);
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!formData.customer_id) {
        setBusinesses([]);
        setFormData((prev) => ({ ...prev, business_id: '' }));
        return;
      }

      setIsBusinessLoading(true);
      try {
        // const res = await fetch(`/api/business?customer_id=${formData.customer_id}`);
        let url = `/api/business?customer_id=${formData.customer_id}`;
        if (role === 'User') {
          url += '&role=User';
        }

        const res = await fetch(url);

        if (!res.ok) throw new Error('사업 정보를 불러올 수 없습니다.');
        const data = await res.json();
        setBusinesses(data.data || []);

        setFormData((prev) => ({ ...prev, business_id: '' }));
      } catch (err) {
        console.error(err);
        setBusinesses([]);
      } finally {
        setIsBusinessLoading(false);
      }
    };

    fetchBusinesses();
  }, [formData.customer_id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!validateTelnum(formData.requester_telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      const response = await fetch(`/api/support/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('기술지원이 수정되었습니다.');
        router.push(
          `/support/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
        );
      } else {
        const data = await response.json();
        throw new Error(data.message || '기술지원 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '기술지원 수정에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객회사
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              {customers?.map(item => (
                <option key={item.id} value={item.id.toString()}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사업
            </label>
            <select
              name="business_id"
              value={formData.business_id ?? ''}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택하세요</option>
              {businesses?.map(item => (
                <option key={item.id} value={item.id.toString()}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청일자
            </label>
            <input
              type="date"
              name="issued"
              value={formData.issued}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구분
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="technical">기술지원</option>
              <option value="consult">기술상담</option>
              <option value="incident">장애지원</option>
              <option value="poc">PoC</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청내역
            </label>
            <textarea
                id="text-input"
                name="issue"
                value={formData.issue}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
                rows={3}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              처리내역
            </label>
            <textarea
                id="text-input"
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
                rows={3}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조치일자
            </label>
            <input
              type="date"
              name="actioned"
              value={formData.actioned}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조치방식
            </label>
            <select
              name="action_type"
              value={formData.action_type}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="phone">유선지원</option>
              <option value="remote">원격지원</option>
              <option value="mail">메일지원</option>
              <option value="site">현장지원</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              담당자
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
              완료여부
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="processing">처리중</option>
              <option value="complete">완료</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청자
            </label>
            <input
              type="text"
              name="requester"
              value={formData.requester || ''}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청자 전화번호 (-포함)
            </label>
            <input
              type="text"
              name="requester_telnum"
              value={formData.requester_telnum || ''}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청자 이메일
            </label>
            <input
              type="text"
              name="requester_email"
              value={formData.requester_email || ''}
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
            href={`/support/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
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
  );
}
