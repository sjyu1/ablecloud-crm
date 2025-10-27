'use client';

import { useEffect, useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface LicenseForm {
  business_id: string;
  company_id: string;
  product_id: string;
  product_name: string;
  product_version: string;
  issued: string;
  expired: string;
  trial: boolean;
  oem: string;
}

interface Business {
  id: number;
  name: string;
  product_name: string;
  product_version: string;
  product_category_name: string;
  manager_company_id: string;
}

interface Props {
  business: Business[];
  role?: string;
}

export default function LicenseRegisterForm({ business, role }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<LicenseForm>({
    business_id: '',
    company_id: '',
    product_id: '',
    product_name: '',
    product_version: '',
    issued: '',
    expired: '',
    trial: false,
    oem: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCheckedToTrial, setIsCheckedToTrial] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (formData.issued > formData.expired) {
        throw new Error('시작일이 종료일보다 클 수 없습니다.');
      }

      setIsLoading(true);
      const response = await fetch('/api/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('라이선스가 생성되었습니다.');
        router.push('/license');
      } else {
        const data = await response.json();
        throw new Error(data.message || '라이선스 생성에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '라이선스 생성에 실패했습니다.';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'business_id') {
      const sel = business.find(b => b.id.toString() === value);
      setFormData(prev => ({
        ...prev,
        company_id: sel ? sel.manager_company_id : '',
        product_name: sel ? sel.product_name : '',
        product_version: sel ? sel.product_version : '',
        oem: sel ? sel.product_category_name : ''
      }));
    }

    if (name === 'issued') {
      setIsChecked(false);
      setIsCheckedToTrial(false);
      setFormData(prev => ({
        ...prev,
        expired: ''
      }));
    }
  };

  const handleCheckboxChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const checked = ev.target.checked;
    setIsChecked(checked);
    setIsCheckedToTrial(false);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        expired: '9999-12-31',
        trial: false
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        expired: '',
        trial: false
      }));
    }
  };

  const handleCheckboxTrialChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const checked = ev.target.checked;
    setIsCheckedToTrial(checked);
    setIsChecked(false);
    if (checked) {
      if (!formData.issued) {
        setError('시작일을 선택하세요.');
        return;
      }
      const newDate = getOneMonthLater(formData.issued);
      setFormData(prev => ({
        ...prev,
        expired: newDate,
        trial: true
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        expired: '',
        trial: false
      }));
    }
  };

  const getOneMonthLater = (date_string: string) => {
    const date = new Date(date_string);
    date.setMonth(date.getMonth() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">사업</label>
          <select
            name="business_id"
            value={formData.business_id}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">선택하세요</option>
            {business.map(b => (
              <option key={b.id} value={b.id.toString()}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">제품</label>
          <div className="w-1/2 mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-gray-900">
              {formData.product_name
                ? `${formData.product_name} (v${formData.product_version})`
                : '사업을 선택하세요'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">만료일</label>
          <input
            type="date"
            name="expired"
            value={formData.expired}
            onChange={handleChange}
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isChecked || isCheckedToTrial}
            required
          />
        </div>
        <div>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ marginLeft: '10px' }}
          />
          <label style={{ marginLeft: '5px' }} className="text-sm font-medium text-gray-700">
            영구 라이선스
          </label>
          <input
            type="checkbox"
            checked={isCheckedToTrial}
            onChange={handleCheckboxTrialChange}
            className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ marginLeft: '10px' }}
            disabled={formData.product_name.includes('Trial 제외')}
          />
          <label style={{ marginLeft: '5px' }} className="text-sm font-medium text-gray-700">
            Trial (Trial 라이선스는 시작일부터 한달 사용가능합니다.)
          </label>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end space-x-2">
        <Link href="/license" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
          취소
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? '처리 중...' : '생성'}
        </button>
      </div>
    </form>
  );
}
