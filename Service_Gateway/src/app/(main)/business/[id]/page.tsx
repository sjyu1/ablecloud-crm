'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface Business {
  id: number;
  name: string;
  status: string;
  issued: string;
  expired: string;
  customer_name: string;
  node_cnt: number;
  core_cnt: number;
  license_key: string;
  license_status: string;
  license_issued: string;
  license_expired: string;
  manager_id: string;
  manager_name: string;
  manager_company: string;
  product_name: string;
  product_version: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function tabProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);

  const [value, setValue] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchBusinessDetail();
  }, []);

  const fetchBusinessDetail = async () => {
    try {
      const response = await fetch(`/api/business/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사업 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setBusiness(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      if (err instanceof Error) {
        if (err.message == 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 사업을 삭제하시겠습니까?')) {
      return;
    }

    if (business?.license_key) {
      alert('사업에 대한 라이센스가 존재합니다. 라이센스를 삭제하세요.');
      return;
    }

    try {
      const response = await fetch(`/api/business/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('사업이 삭제되었습니다.');
      } else {
        throw new Error('사업 삭제에 실패했습니다.');
      }

      router.push('/business');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">사업을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => window.location.href = `/business/${business.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            삭제
          </button>
          <button
            onClick={() => window.location.href = `/business`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="상세정보" {...tabProps(0)} />
            <Tab label="라이센스 정보" {...tabProps(1)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업명</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 담당자</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.manager_name} ({business.manager_company})
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">고객회사</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.customer_name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품명</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.product_name} (v{business.product_version})
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">노드수</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.node_cnt}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">코어수</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.core_cnt}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 상태</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.status === 'standby' ? ('대기 중') : business.status === 'meeting' ? ('고객 미팅') : business.status === 'poc' ? ('PoC') :business.status === 'bmt' ? ('BMT') :business.status === 'ordering' ? ('발주') :business.status === 'proposal' ? ('제안') :business.status === 'ordersuccess' ? ('수주 성공') :business.status === 'cancel' ? ('취소') : ('Unknown Type')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 시작일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {format(business.issued, 'yyyy-MM-dd')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 종료일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {format(business.expired, 'yyyy-MM-dd')}
                </p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        {business.license_key ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">라이센스 키</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.license_key}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">상태</h3>
                <p className="mt-1 text-lg text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      business.license_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                  {/* <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"> */}
                    {business.license_status === 'active' ? '활성' : '비활성'}
                  </span>
                </p>
              </div>
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500">코어수</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.license_cpu_core}
                </p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">시작일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {format(business.license_issued, 'yyyy-MM-dd')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">만료일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {format(business.license_expired, 'yyyy-MM-dd')}
                </p>
              </div>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">라이센스 정보가 없습니다.</h3>
            </div>
          </div>
        </div>
        )}
        </CustomTabPanel>
      </Box>

    </div>
  );
} 
