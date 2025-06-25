'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import Link from 'next/link';

interface SupportForm {
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

export default function SupportRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SupportForm>({
    customer_id: '',
    business_id: '',
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
    note: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [business, setBusinesses] = useState<Business[]>([]);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);
    const username = getCookie('username');
    setUsername(username ?? undefined);

    const fetchCustomers = async () => {
      try {
        let url = `/api/customer?page=1&limit=10000`;

        if (role == 'User') {
          url += `&role=User`;
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

        setCustomers(result.data);
      } catch (error) {
        alert('고객 목록 조회에 실패했습니다.');
      }
    };

    fetchCustomers();
  }, []);

  const fetchBusiness = async (customer_id:string) => {
    try {
      let url = `/api/business?page=1&limit=10000`;

      if (role == 'User') {
        url += `&role=User`;
      }

      if (customer_id) {
        url += `&customer_id=`+customer_id;
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

      setBusinesses(result.data);
    } catch (error) {
      alert('고객 목록 조회에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 전화번호 밸리데이션
      if (formData.requester_telnum && !validateTelnum(formData.requester_telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }

      const registerFormData = { 
        ...formData,
        business_id: formData.business_id !== ''? formData.business_id : null,
        writer: username
      }
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerFormData),
      });

      if (response.ok) {
        alert('기술지원이 등록되었습니다.');
      } else {
        throw new Error('기술지원 등록에 실패했습니다.');
      }

      router.push('/support');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 고객 사업 조회
    if (name === 'customer_id') {
      fetchBusiness(value);
    }
  };

  // 전화번호 유효성 검사 함수
  const validateTelnum = (telnum: string) => {
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    if (!phoneRegex.test(telnum)) {
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">기술지원 등록</h1>
      </div>

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
                value={formData.business_id}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {business?.map(item => (
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
                value={formData.requester}
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
                value={formData.requester_telnum}
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
                value={formData.requester_email}
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
      </div>
    </div>
  );
}