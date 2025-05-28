'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../store/authStore';
import Link from 'next/link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface License {
  id: number;
  license_key: string;
  product_id: string;
  product_name: string;
  product_version: string;
  business_name: string;
  issued_name: string;
  status: string;
  issued: string;
  expired: string;
  trial: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
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

export default function LicensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [hasNextPage, setHasNextPage] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  let prevTrial = searchParams.get('trial');
  const initialTab = prevTrial === '1' ? 1 : 0;
  const [value, setValue] = useState(initialTab);
  const trial = searchParams.get('trial') || '0';

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    // 검색필터 존재여부(새로고침시 사용)
    const currentName = searchParams.get('businessName') ?? '';
    if (businessName !== currentName) {
      setBusinessName(currentName);
    }
    
    setLicenses([]);

    const fetchLicenses = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;
        const currentName = searchParams.get('businessName');
  
        let url = `/api/license?page=${page}&limit=${pagination.itemsPerPage}`;
        if (currentName) {
          url += `&businessName=${currentName}`;
        }
        if (role === 'User') {
          url += `&role=User`;
        }
        if (trial) {
          url += `&trial=${trial}`;
        }
  
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || '오류가 발생했습니다.');
        }
  
        setLicenses(result.data);
        setPagination(prev => ({
          ...prev,
          totalItems: result.pagination.totalItems,
          totalPages: result.pagination.totalPages,
          currentPage: result.pagination.currentPage,
        }));
  
      } catch (err) {
        if (err instanceof Error) {
          if (err.message == 'Failed to fetch user information') {
            logoutIfTokenExpired(); // 토큰 만료시 로그아웃
          }
        } else {
          alert('라이선스 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenses();
  }, [searchParams.get('page'), searchParams.get('businessName'), pagination.itemsPerPage, trial]);

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    try {
      const params = new URLSearchParams();
      if (businessName.trim()) {
        params.set('businessName', businessName.trim());
      }
      params.set('page', '1');
      params.set('trial', trial);

      router.push(`/license?${params.toString()}`);
    } catch (error) {
      alert(error);
    }
  };

  // 초기화 버튼 클릭 핸들러
  const handleResetClick = () => {
    setBusinessName('');
    router.push('/license?page=1');
  };

  // 탭 핸들러
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    const params = new URLSearchParams(searchParams.toString());

    params.delete('trial');
    params.set('trial', newValue.toString());
    params.set('page', '1');
    router.push(`/license?${params.toString()}`);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/license?${params.toString()}`);
  };

  // 렌더링 데이터
  const renderPartnerTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  라이선스 키
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사업명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  발급자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시작일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  만료일
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trial
                </th> */}
                {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 text-sm">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/license/${license.id}?page=${pagination.currentPage}&trial=${prevTrial=prevTrial==null?'0':prevTrial}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {license.license_key}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {license.product_name} (v{license.product_version})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {license.business_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        license.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {license.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {license.issued_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {license.issued}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {license.expired}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {license.trial == '1' ? 'O' : '-'}
                    </td> */}
                    {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/license/${license.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        상세
                      </Link>
                      <button
                        onClick={() => {}}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
              {!isLoading && licenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 text-sm">
                    라이선스 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이선스 관리</h1>
        <Link
          href="/license/register"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          라이선스 생성
        </Link>
      </div>

      {/* 검색 필터 */}
      <div className="mb-4 flex gap-2 justify-end">
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="사업명으로 검색"
          className="px-2 py-1 text-sm border rounded-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchClick();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleSearchClick()}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>
        {/* {searchParams.get('businessName') && (
          <button
            type="button"
            onClick={handleResetClick}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            초기화
          </button>
        )} */}
      </div>

      {/* 라이선스 목록 */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="일반" {...tabProps(0)} />
          <Tab label="TRIAL" {...tabProps(1)} />
        </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          {renderPartnerTable()}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          {renderPartnerTable()}
        </CustomTabPanel>
      </Box>

      {/* 페이지네이션 */}
      {licenses.length > 0 && (
        <div className="flex justify-center items-center mt-4">
          <div className="flex items-center gap-0">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
        
            {(() => {
              const pages = [];
              const total = pagination.totalPages;
              const current = pagination.currentPage;
        
              const createText = (num: number) => {
                if (num === current) {
                  return (
                    <button
                      key={num}
                      disabled
                      className="px-2 py-1 text-sm border rounded bg-blue-500 text-white font-bold cursor-default"
                    >
                      {num}
                    </button>
                  );
                } else {
                  return (
                    <span
                      key={num}
                      onClick={() => handlePageChange(num)}
                      className="px-3 py-2 text-sm cursor-pointer text-gray-700 hover:text-blue-500"
                    >
                      {num}
                    </span>
                  );
                }
              };
        
              if (total <= 5) {
                for (let i = 1; i <= total; i++) {
                  pages.push(createText(i));
                }
              } else {
                if (current <= 3) {
                  for (let i = 1; i <= 5; i++) {
                    pages.push(createText(i));
                  }
                  pages.push(
                    <span key="ellipsis1" className="text-sm px-2 text-gray-500">...</span>
                  );
                } else if (current >= total - 2) {
                  pages.push(
                    <span key="ellipsis1" className="text-sm px-2 text-gray-500">...</span>
                  );
                  for (let i = total - 4; i <= total; i++) {
                    pages.push(createText(i));
                  }
                } else {
                  pages.push(
                    <span key="ellipsis1" className="text-sm px-2 text-gray-500">...</span>
                  );
                  for (let i = current - 2; i <= current + 2; i++) {
                    pages.push(createText(i));
                  }
                  pages.push(
                    <span key="ellipsis2" className="text-sm px-2 text-gray-500">...</span>
                  );
                }
              }
        
              return pages;
            })()}
        
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!hasNextPage}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
        
            <div className="text-sm text-gray-600 ml-4">
              전체 {pagination.totalItems}개 항목
            </div>
          </div>
        </div>
      )}
    </div>
  );
}