'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
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
  license_trial: string;
  manager_id: string;
  manager_name: string;
  manager_company: string;
  product_name: string;
  product_version: string;
  details: string;
  deposit_use: string;
}

interface Business_history {
  id: number;
  issue: string;
  solution: string;
  status: string;
  issued: string;
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
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [business_history, setBusiness_history] = useState<Business_history[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'history' ? 2 : 0;
  const prevPage = searchParams.get('page') || '1';
  const prevSearchField = searchParams.get('searchField') || 'name';
  const prevSearchValue = searchParams.get('searchValue') || '';

  const [value, setValue] = useState<number>(initialTab);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchBusinessDetail();
    // fetchBusiness_historyDetail();
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
      // if (err instanceof Error) {
      //   if (err.message == 'Failed to fetch user information') {
      //     logoutIfTokenExpired(); // 토큰 만료시 로그아웃
      //   }
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusiness_historyDetail = async () => {
    try {
      const response = await fetch(`/api/business/${params.id}/history`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '사업 히스토리 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setBusiness_history(result.data);
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
      alert('사업에 대한 라이선스가 존재합니다. 라이선스를 삭제하세요.');
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

      router.push(`/business?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!confirm('정말 이 사업 히스토리를 삭제하시겠습니까')) return;
  
    try {
      const response = await fetch(`/api/business/${params.id}/history/${historyId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('사업 히스토리 삭제를 실패했습니다.');
      }
  
      alert('사업 히스토리가 삭제 되었습니다.');
      fetchBusiness_historyDetail(); // 삭제 후 목록 갱신
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
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
            onClick={() => router.push(`/business/${business.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            수정
          </button>
          {/* <button
            onClick={() => router.push(`/business/${business.id}/history/register?tab=history`)}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            히스토리 등록
          </button> */}
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/business?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
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
            <Tab label="라이선스 정보" {...tabProps(1)} />
            {/* {role !== 'User' && <Tab label="히스토리" {...tabProps(2)} />} */}
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업</h3>
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
                <h3 className="text-sm font-medium text-gray-500">제품</h3>
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
                  {business.core_cnt} {business.deposit_use == '1' && (' (크레딧 사용)')}
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
                  {business.issued}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 종료일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.expired}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">세부사항</h3>
                <textarea
                  id="text-input"
                  name="details"
                  value={business.details ?? ''}
                  rows={5}
                  readOnly
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {/* <p className="mt-1 text-lg text-gray-900">
                  {business.details}
                </p> */}
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
                <h3 className="text-sm font-medium text-gray-500">라이선스 키</h3>
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
              <div>
                <h3 className="text-sm font-medium text-gray-500">Trial</h3>
                <p className="mt-1 text-lg text-gray-900">{business.license_trial == '1' ? 'O' : '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">시작일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.license_issued}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">만료일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {business.license_expired}
                </p>
              </div>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">라이선스 정보가 없습니다.</h3>
            </div>
          </div>
        </div>
        )}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
        <table className="min-w-full divide-y divide-gray-200 border-b border-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이슈
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                해결방안
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                발생일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {business_history.map((history) => (
              <tr key={history.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/business/${params.id}/history/${history.id}?tab=history`)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {history.issue}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {history.solution}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {history.status === 'in_progress' ? ('진행중') : history.status === 'resolved' ? ('완료') : history.status === 'canceled' ? ('취소') : ('Unknown Type')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(history.issued).toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHistory(history);
                      setIsUpdateModalOpen(true);
                    }}
                    className="text-gray-600 hover:underline text-sm  mr-4"
                  >
                    수정
                  </button> */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(history.id);
                    }}
                    className="text-red-600 hover:underline text-sm"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {business_history.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                  사업 히스토리 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </CustomTabPanel>
      </Box>
    </div>
  );
}