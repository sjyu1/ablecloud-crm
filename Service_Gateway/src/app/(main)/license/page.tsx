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
  const [licenses_trial, setLicenses_trial] = useState<License[]>([]);
  const [productName, setProductName] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [pagination_trial, setPagination_trial] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasNextPage_trial, setHasNextPage_trial] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    // 일반 라이센스
    const fetchLicenses = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;
        const currentName = searchParams.get('productName');
        
        // 전체 라이센스 목록을 가져오는 API 호출
        let totalUrl = `/api/license?trial=0&page=1&limit=10000`;
        if (currentName) {
          totalUrl += `&name=${currentName}`;
        }
        if (role === 'User') {
          totalUrl += `&role=User`;
        }
        
        const totalResponse = await fetch(totalUrl);
        const totalResult = await totalResponse.json();
        const totalCount = totalResult.data ? totalResult.data.length : 0;

        // 현재 페이지 데이터 가져오기
        let url = `/api/license?trial=0&page=${page}&limit=10`;
        if (currentName) {
          url += `&name=${currentName}`;
        }
        if (role === 'User') {
          url += `&role=User`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || '오류가 발생했습니다.');
        }

        // 현재 페이지의 데이터 설정
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const pageData = totalResult.data.slice(startIndex, endIndex);
        setLicenses(pageData);

        // 다음 페이지 존재 여부 확인
        const hasNext = endIndex < totalCount;
        setHasNextPage(hasNext);

       // 페이지네이션 정보 업데이트
        const totalPages = Math.ceil(totalCount / 10);
        setPagination({
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalCount,
          itemsPerPage: 10
        });

      } catch (err) {
        if (err instanceof Error) {
          if (err.message == 'Failed to fetch user information') {
            logoutIfTokenExpired(); // 토큰 만료시 로그아웃
          }
        } else {
          alert('라이센스 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // 트라이얼 라이센스
    const fetchLicenses_trial = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;
        const currentName = searchParams.get('productName');
        
        // 전체 라이센스 목록을 가져오는 API 호출
        let totalUrl = `/api/license?trial=1&page=1&limit=10000`;
        if (currentName) {
          totalUrl += `&name=${currentName}`;
        }
        if (role === 'User') {
          totalUrl += `&role=User`;
        }
        
        const totalResponse = await fetch(totalUrl);
        const totalResult = await totalResponse.json();
        const totalCount = totalResult.data ? totalResult.data.length : 0;

        // 현재 페이지 데이터 가져오기
        let url = `/api/license?trial=1&page=${page}&limit=10`;
        if (currentName) {
          url += `&name=${currentName}`;
        }
        if (role === 'User') {
          url += `&role=User`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || '오류가 발생했습니다.');
        }

        // 현재 페이지의 데이터 설정
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const pageData = totalResult.data.slice(startIndex, endIndex);
        setLicenses_trial(pageData);

        // 다음 페이지 존재 여부 확인
        const hasNext = endIndex < totalCount;
        setHasNextPage_trial(hasNext);

       // 페이지네이션 정보 업데이트
        const totalPages = Math.ceil(totalCount / 10);
        setPagination_trial({
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalCount,
          itemsPerPage: 10
        });

      } catch (err) {
        if (err instanceof Error) {
          if (err.message == 'Failed to fetch user information') {
            logoutIfTokenExpired(); // 토큰 만료시 로그아웃
          }
        } else {
          alert('라이센스 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenses();
    fetchLicenses_trial();
  }, [searchParams, pagination.itemsPerPage, pagination_trial.itemsPerPage]);

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    try {
      const params = new URLSearchParams();
      if (productName.trim()) {  // 공백 제거 후 체크
        params.set('productName', productName.trim());
      }
      params.set('page', '1');

      // URL 업데이트
      router.push(`/license?${params.toString()}`);
    } catch (error) {
      // alert('검색 중 오류가 발생했습니다.');
      alert(error);
    }
  };

  // 초기화 버튼 클릭 핸들러
  const handleResetClick = () => {
    setProductName('');
    router.push('/license?page=1');
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/license?trial=0&${params.toString()}`);
  };

  const handlePageChange_trial = (newPage: number) => {
    if (newPage < 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/license?trial=1&${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">라이센스 관리</h1>
        <Link
          href="/license/register"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          라이센스 생성
        </Link>
      </div>

      {/* 검색 필터 */}
      {/* <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="제품명으로 검색"
          className="px-3 py-2 border rounded-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchClick();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearchClick}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>
        {searchParams.get('productName') && (
          <button
            type="button"
            onClick={handleResetClick}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            초기화
          </button>
        )}
      </div> */}

      {/* 라이센스 목록 */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="일반" {...tabProps(0)} />
          <Tab label="TRIAL" {...tabProps(1)} />
        </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  라이센스 키
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
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/license/${license.id}?page=${pagination.currentPage}`)}>
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
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    라이센스 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  라이센스 키
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
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                licenses_trial.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/license/${license.id}?page=${pagination.currentPage}`)}>
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
              {!isLoading && licenses_trial.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    라이센스 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {licenses_trial.length > 0 && (
          <div className="flex justify-center items-center mt-4">
            <div className="flex items-center gap-0">
              <button
                onClick={() => handlePageChange(pagination_trial.currentPage - 1)}
                disabled={pagination_trial.currentPage === 1}
                className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
          
              {(() => {
                const pages = [];
                const total = pagination_trial.totalPages;
                const current = pagination_trial.currentPage;
          
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
                onClick={() => handlePageChange(pagination_trial.currentPage + 1)}
                disabled={!hasNextPage_trial}
                className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
          
              <div className="text-sm text-gray-600 ml-4">
                전체 {pagination_trial.totalItems}개 항목
              </div>
            </div>
          </div>
        )}
        </CustomTabPanel>
      </Box>
    </div>
  );
} 
