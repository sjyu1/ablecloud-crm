'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import Link from 'next/link';

interface PartnerForm {
  name: string;
  telnum: string;
  level: string;
  deposit_use: boolean;
  deposit: string;
  product_category: string[];
}

interface Product_category {
  id: number;
  name: string;
}

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PartnerForm>({
    name: '',
    telnum: '',
    level: 'platinum',
    deposit_use: false,
    deposit: '',
    product_category: [],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [product_category, setProduct_category] = useState<Product_category[]>([]);

  useEffect(() => {
    const fetchProduct_category = async () => {
      try {
        let url = `/api/product/category`;

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

        setProduct_category(result.data);

        // 첫번째 항목 자동 체크
        if (result.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            product_category: [result.data[0].id.toString()]
          }));
        }
      } catch (error) {
        alert('제품 카테고리 목록 조회에 실패했습니다.');
      }
    };

    fetchProduct_category();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 전화번호 밸리데이션
      if (!validateTelnum(formData.telnum)) {
        throw new Error('전화번호 형식이 올바르지 않습니다.');
      }
  
      // 제품 카테고리 밸리데이션
      if (formData.product_category.length === 0) {
        throw new Error('제품 카테고리를 최소 1개 이상 선택해야 합니다.');
      }

      setIsLoading(true);
      const formDataToSend: any = {
        ...formData,
        product_category: formData.product_category.join(','),
        ...(formData.deposit_use && { credit: formData.deposit })
      };
      
      if (!formData.deposit_use) {
        delete formDataToSend.deposit;
      }

      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend),
      });

      if (response.ok) {
        alert('파트너가 등록되었습니다.');
      } else {
        throw new Error(response.status == 409? '이미 존재하는 회사입니다.' : '파트너 등록에 실패했습니다.');
      }

      router.push('/partner');
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

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
  
    setFormData(prev => {
      const selected = prev.product_category || [];
  
      return {
        ...prev,
        product_category: checked
          ? [...selected, value]
          : selected.filter(item => item !== value),
      };
    });
  };

  // 전화번호 유효성 검사 함수
  const validateTelnum = (telnum: string) => {
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    if (!phoneRegex.test(telnum)) {
      return false;
    }
    return true;
  };

  //크레딧 체크
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setFormData(prev => ({
      ...prev,
      deposit_use: checked
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                회사
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
                등급
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="PLATINUM">PLATINUM</option>
                <option value="GOLD">GOLD</option>
                <option value="SILVER">SILVER</option>
                <option value="VAR">VAR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품 카테고리
              </label>
              <div className="w-1/2 grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md">
                {product_category.map(item => (
                  <label
                    key={item.id}
                    className="flex items-center space-x-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      name="product_category"
                      value={item.id}
                      checked={formData.product_category.includes(item.id.toString())}
                      onChange={handleCheckboxGroupChange}
                      className="rounded border-gray-300"
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <input
                type="checkbox"
                name="deposit_use"
                checked={formData.deposit_use}
                onChange={handleCheckboxChange}
                className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{marginLeft: '10px'}}
              />
              <label className="text-sm font-medium text-gray-700" style={{marginLeft: '5px'}}>
                크레딧 구매
              </label>
            </div>
          </div>
          {formData.deposit_use && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구매 코어수
            </label>
            <input
              type="number"
              name="deposit"
              min="0"
              value={formData.deposit}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href="/partner"
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
