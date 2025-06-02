'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import Link from 'next/link';

interface LicenseForm {
  business_id: string;
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
}

export default function LicenseRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LicenseForm>({
    business_id: '',
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
  const [business, setBusiness] = useState<Business[]>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCheckedToTrial, setIsCheckedToTrial] = useState<boolean>(false);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [partner, setPartner] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    const fetchBusiness = async () => {
      try {
        let url = `/api/business?available=true`;

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

        setBusiness(result.data);
      } catch (error) {
        alert('제품 목록 조회에 실패했습니다.');
      }
    };

    if (role == 'User') {
      const fetchUserinfo = async () => {
        try {
          let url = `/api/user/userinfo?`;
  
          const response = await fetch(url);
          const result = await response.json();
          setPartner(result.data.name)
      
        } catch (err) {
          console.error('userinfo 호출 실패:', err);
        }
      };
      fetchUserinfo();
    }

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
        alert('라이선스가 등록되었습니다.');
      } else {
        throw new Error('라이선스 생성에 실패했습니다.');
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

    if (name === 'business_id') {
      // Find the selected business item
      const selectedBusiness = business.find(item => item.id.toString() === value);

      // Update both business_id and product_name in formData
      setFormData((prevFormData) => ({
        ...prevFormData,
        business_id: value,
        product_name: selectedBusiness ? selectedBusiness.product_name : '',
        product_version: selectedBusiness ? selectedBusiness.product_version : ''
      }));
    }

    if (name === 'issued') {
      setIsChecked(false);  // 영구 라이선스 체크박스 해제
      setIsCheckedToTrial(false); // Trial 체크박스 해제
      formData.expired = ''
    }
  };

  //영구 라이선스 체크
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
    setIsCheckedToTrial(false); // Trial 체크박스 해제

    if (event.target.checked) {
      formData.expired = '9999-12-31'
      formData.trial = false
    } else {
      formData.expired = ''
      formData.trial = false
    }
  };
  
  //Trial 라이선스 체크
  const handleCheckboxTrialChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsCheckedToTrial(event.target.checked);
    setIsChecked(false); // 영구 라이선스 체크박스 해제
    if (event.target.checked) {
      if (!formData.issued) {
        setError('시작일을 선택하세요.');
      }
      const newDate = getOneMonthLater(formData.issued);
      formData.expired = newDate
      formData.trial = true
    } else {
      formData.expired = ''
      formData.trial = false
    }
  };

  // 한 달 후 날짜를 계산하는 함수
  const getOneMonthLater = (date_string: string | number | Date) => {
    const date = new Date(date_string); // date_string은 'YYYY-MM-DD' 형식
    date.setMonth(date.getMonth() + 1);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이선스 생성</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
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
                제품명
              </label>
              <div className="w-1/2 mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                <span className="text-gray-900">
                  {formData.product_name ? `${formData.product_name} (v${formData.product_version})` : '사업명을 선택하세요'}
                </span>
              </div>
            </div>
            <div className={role === 'Admin' ? '' : 'hidden'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OEM
              </label>
              <select
                name="oem"
                value={formData.oem}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="null">ABLESTACK</option>
                <option value="clostack">CLOSTACK</option>
                <option value="hv">HV</option>
              </select>
            </div>
            <div className={partner === '클로잇' ? '' : 'hidden'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OEM
              </label>
              <select
                name="oem"
                value={formData.oem}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="null">ABLESTACK</option>
                <option value="clostack">CLOSTACK</option>
              </select>
            </div>
            <div className={partner === '효성' ? '' : 'hidden'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OEM
              </label>
              <select
                name="oem"
                value={formData.oem}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="null">ABLESTACK</option>
                <option value="hv">HV</option>
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
                checked={isCheckedToTrial}
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