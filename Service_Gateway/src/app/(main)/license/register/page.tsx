'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LicenseForm {
  // license_key: string;
  product_id: string;
  // status: string;
  product_type: string;
  // cpu_core: number;
  business_id: string;
  issued: string;
  expired: string;
}

interface Product {
  id: number;
  name: string;
  version: string;
  created: string;
}

interface Business {
  id: number;
  name: string;
}

export default function LicenseRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LicenseForm>({
    // license_key: '',
    product_id: '',
    // status: 'active',
    product_type: 'vm',
    business_id: '',
    // cpu_core: 0,
    issued: '',
    expired: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business[]>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `/api/product`;

        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) {
          // alert(result.message);
          return;
        }

        setProducts(result.data);
      } catch (error) {
        alert('제품 목록 조회에 실패했습니다.');
      }
    };

    const fetchBusiness = async () => {
      try {
        let url = `/api/business?available=true`;

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
          // alert(result.message);
          return;
        }

        setBusiness(result.data);
      } catch (error) {
        alert('제품 목록 조회에 실패했습니다.');
      }
    };

    fetchProducts();
    fetchBusiness();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (formData.issued > formData.expired){
        throw new Error('시작일이 종료일보다 클 수 없습니다.');
      }

      setIsLoading(true);
      const response = await fetch('/api/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('라이센스가 등록되었습니다.');
      } else {
        throw new Error('라이센스 생성에 실패했습니다.');
      }

      router.push('/license');
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

  //영구 라이센스 체크
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
    if (event.target.checked) {
      formData.expired = '9999-12-31'
    } else {
      formData.expired = ''
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이센스 생성</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                라이센스 키
              </label>
              <input
                type="text"
                name="license_key"
                value={formData.license_key}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품명
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
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품유형
              </label>
              <select
                name="type"
                value={formData.product_type}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vm">ABLESTACK VM</option>
                <option value="hci">ABLESTACK HCI</option>
                <option value="vm_beta">ABLESTACK VM - Beta</option>
                <option value="hci_beta">ABLESTACK HCI - Beta</option>
              </select>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                코어수
              </label>
              <input
                type="number"
                name="cpu_core"
                value={formData.cpu_core}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업명
              </label>
              <select
                name="business_id"
                value={formData.business_id}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {business.map(item => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.name}
                  </option>
                ))}
              </select>
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
                disabled={isChecked}
                required
              />
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{marginLeft: '10px'}}
              />
              <label className="text-sm font-medium text-gray-700" style={{marginLeft: '5px'}}>
                영구 라이센스
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
              href="/license"
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
              {isLoading ? '처리 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
