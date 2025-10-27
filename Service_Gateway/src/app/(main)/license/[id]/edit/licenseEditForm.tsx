'use client';

import React, { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface LicenseForm {
  id: number;
  license_key: string;
  product_id: string;
  product_name: string;
  business_name: string;
  issued: string;
  expired: string;
  trial: boolean | string;
}

interface Product {
  id: number;
  name: string;
  version: string;
}

interface Props {
  license: LicenseForm;
  prevPage: string;
  prevTrial: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function LicenseEditForm({
  license,
  prevPage,
  prevTrial,
  prevSearchField,
  prevSearchValue,
}: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<LicenseForm>(license);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(formData.expired === '9999-12-31');
  const [isCheckedToTrial, setIsCheckedToTrial] = useState(formData.trial === true || formData.trial === '1');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'issued') {
      setIsChecked(false);
      setIsCheckedToTrial(false);
      setFormData(prev => ({ ...prev, expired: '', trial: false }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setIsChecked(checked);
    setIsCheckedToTrial(false);

    setFormData(prev => ({
      ...prev,
      expired: checked ? '9999-12-31' : '',
      trial: false,
    }));
  };

  const handleCheckboxTrialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setIsCheckedToTrial(checked);
    setIsChecked(false);

    if (checked && !formData.issued) {
      setError('시작일을 선택하세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      expired: checked ? getOneMonthLater(formData.issued) : '',
      trial: checked,
    }));
  };

  const getOneMonthLater = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.issued > formData.expired) {
        throw new Error('시작일이 종료일보다 클 수 없습니다.');
      }

      const response = await fetch(`/api/license/${license.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('라이선스가 수정되었습니다.');
        router.push(`/license/${license.id}?page=${prevPage}&trial=${prevTrial}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '라이선스 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '라이선스 수정에 실패했습니다.';
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
            라이선스 키
          </label>
          <div className="w-1/2 mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-gray-900">
              {formData.license_key}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제품
          </label>
          <div className="w-1/2 mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-gray-900">
              {formData.product_name}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사업
          </label>
          <div className="w-1/2 mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-gray-900">
              {formData.business_name}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시작일
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
            만료일
          </label>
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
            style={{marginLeft: '10px'}}
          />
          <label className="text-sm font-medium text-gray-700" style={{marginLeft: '5px'}}>
            영구 라이선스
          </label>
          <input
            type="checkbox"
            checked={isCheckedToTrial || formData.trial=='1'}
            onChange={handleCheckboxTrialChange}
            className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{marginLeft: '10px'}}
            disabled={formData.product_name.includes('Trial 제외')}
          />
          <label className="text-sm font-medium text-gray-700" style={{marginLeft: '5px'}}>
            Trial (Trial 라이선스는 시작일부터 한달 사용가능합니다.)
          </label>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Link
          href={`/license/${license.id}?page=${prevPage}&trial=${prevTrial}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
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
  );
} 
