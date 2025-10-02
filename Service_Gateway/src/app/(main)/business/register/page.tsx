'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import Link from 'next/link';

interface BusinessForm {
  name: string;
  status: string;
  issued: string;
  expired: string;
  customer_id: string;
  node_cnt: number;
  core_cnt: number;
  manager_id: string;
  product_id: string;
  details: string;
  deposit_use: boolean;
  credit: number;
  partner_id: string;
}

interface Customer {
  id: number;
  name: string;
  telnum: string;
}

interface Manager {
  id: number;
  username: string;
  company: string;
  company_id: string;
  // deposit_use: string;
  deposit: string;
  credit: string;
}

interface Product {
  id: string;
  name: string;
  version: string;
}

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BusinessForm>({
    name: '',
    status: 'standby',
    issued: '',
    expired: '',
    customer_id: '',
    core_cnt: 0,
    node_cnt: 0,
    manager_id: '',
    product_id: '',
    details: '',
    deposit_use: false,
    credit: 0,
    partner_id: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [role, setRole] = useState<string | undefined>(undefined);
  const selectedManager = managers.find(m => m.id.toString() === formData.manager_id);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    const fetchManagers = async () => {
      try {
        let url = `/api/user/forCreateManager?order=name`;

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

        setManagers(result.data);
      } catch (error) {
        alert('사업담당자 목록 조회에 실패했습니다.');
      }
    };

    const fetchCustomers = async () => {
      try {
        let url = `/api/customer?page=1&limit=10000&order=name`;

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

    fetchManagers();
    // fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async (managerId?: string) => {
    try {
      let url = `/api/product`;

      if (managerId !== '') {
        url += `?managerId=${managerId}`;
      }

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

      setProducts(result.data);
    } catch (error) {
      alert('사업담당자 목록 조회에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (formData.deposit_use && selectedManager) {
        const availableCredit = parseInt(selectedManager.deposit)-parseInt(selectedManager.credit); //사용 가능 크레딧
        const remainingCredit = availableCredit - formData.core_cnt;  // 크레딧 사용 후 잔여 크레딧
      
        if (remainingCredit < 0) {
          throw new Error(`크레딧이 부족합니다. 현재 사용 가능 크레딧은 ${availableCredit}이며, 필요한 크레딧은 ${formData.core_cnt}입니다.`);
        } else {
          formData.partner_id = selectedManager.company_id;
          formData.credit = remainingCredit;
        }
      }

      if (formData.issued > formData.expired){
        throw new Error('시작일이 종료일보다 클 수 없습니다.');
      }

      setIsLoading(true);
      const response = await fetch('/api/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('사업이 등록되었습니다.');
      } else {
        throw new Error(response.status == 409? '이미 존재하는 사업입니다.' : '사업 등록에 실패했습니다.');
      }

      router.push('/business');
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

    // 사업담당자 선택시 사용가능한 제품 조회
    if (name === 'manager_id') {
      fetchProducts(value);
    }
  };

  //크레딧 체크
  const handleCreditCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setFormData(prev => ({
      ...prev,
      deposit_use: checked
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업
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
                사업 담당자
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
                {customers.map(item => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업 상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standby">대기 중</option>
                <option value="meeting">고객 미팅</option>
                <option value="poc">PoC</option>
                <option value="bmt">BMT</option>
                <option value="ordering">발주</option>
                <option value="proposal">제안</option>
                <option value="ordersuccess">수주 성공</option>
                <option value="cancel">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {products.map(item => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.name} (v{item.version})
                  </option>
                ))}
              </select>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업유형
              </label>
              <select
                name="type"
                value={formData.product_type}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vm">ABLESTACK VM</option>
                <option value="hci">ABLESTACK HCI</option>
                <option value="vm_trial">ABLESTACK VM - Trial</option>
                <option value="hci_trial">ABLESTACK HCI - Trial</option>
              </select>
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                노드수
              </label>
              <input
                type="number"
                name="node_cnt"
                min="0"
                value={formData.node_cnt}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                코어수
              </label>
              <input
                type="number"
                name="core_cnt"
                min="0"
                value={formData.core_cnt}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedManager?.deposit && (
                <div className="text-sm text-gray-600 space-y-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.deposit_use}
                      onChange={handleCreditCheckboxChange}
                      className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>크레딧 사용</span>
                    <div>
                      (사용 가능 크레딧: {Number(selectedManager.deposit)-Number(selectedManager.credit)} / 크레딧 사용 후 잔여 크레딧:{' '}
                      <span className={
                        Number(selectedManager.deposit)-Number(selectedManager.credit) - (formData.deposit_use ? formData.core_cnt : 0) < 0
                          ? 'text-red-500 font-bold'
                          : ''
                      }>
                        {Number(selectedManager.deposit)-Number(selectedManager.credit) - (formData.deposit_use ? formData.core_cnt : 0)})
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업 시작일
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
                사업 종료일
              </label>
              <input
                type="date"
                name="expired"
                value={formData.expired}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세부사항
              </label>
              <textarea
                id="text-input"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
                rows={5}
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
              href="/business"
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