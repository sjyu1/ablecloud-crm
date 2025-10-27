'use client';

import { useState, useEffect } from 'react';
import { useRouter, redirect } from 'next/navigation';
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
  deposit: string;
  credit: string;
}

interface Product {
  id: string;
  name: string;
  version: string;
}

interface Props {
  managers: Manager[];
  customers: Customer[];
  role?: string;
}

export default function BusinessRegisterForm({ managers, customers, role }: Props) {
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
  const [products, setProducts] = useState<Product[]>([]);
  const selectedManager = managers.find(m => m.id.toString() === formData.manager_id);

  const fetchProducts = async (managerId?: string) => {
    try {
      let url = `/api/product`;

      if (managerId) {
        url += `?managerId=${managerId}`;
      }
      if (role === 'User') {
        url += managerId ? '&role=User' : '?role=User';
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        alert('제품 목록 조회에 실패했습니다.');
        return;
      }

      setProducts(result.data);
    } catch (error) {
      alert('제품 목록 조회에 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'core_cnt' || name === 'node_cnt' ? Number(value) : value
    }));

    if (name === 'manager_id') {
      fetchProducts(value);
    }
  };

  const handleCreditCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      deposit_use: e.target.checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.deposit_use && selectedManager) {
        const availableCredit = parseInt(selectedManager.deposit) - parseInt(selectedManager.credit);
        const remainingCredit = availableCredit - formData.core_cnt;

        if (remainingCredit < 0) {
          throw new Error(`크레딧이 부족합니다. 현재 사용 가능 크레딧은 ${availableCredit}이며, 필요한 크레딧은 ${formData.core_cnt}입니다.`);
        } else {
          formData.partner_id = selectedManager.company_id;
          formData.credit = remainingCredit;
        }
      }

      if (formData.issued > formData.expired) {
        throw new Error('시작일이 종료일보다 클 수 없습니다.');
      }

      const response = await fetch('/api/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('사업이 등록되었습니다.');
        router.push('/business');
      } else {
        const data = await response.json();
        throw new Error(data.message || '사업 등록에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '사업 등록에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white rounded-lg shadow">
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
  );
}
