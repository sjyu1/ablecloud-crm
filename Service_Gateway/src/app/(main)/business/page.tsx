'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../store/authStore';
import Link from 'next/link';

interface Business {
  id: number;
  name: string;
  issued: string;
  expired: string;
  customer_name: string;
  status: string;
  node_cnt: string;
  core_cnt: string;
  manager_name: string;
  manager_company: string;
  product_name: string;
  product_version: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const statusMap: Record<string, string> = {
  standby: '대기 중',
  meeting: '고객 미팅',
  poc: 'PoC',
  bmt: 'BMT',
  ordering: '발주',
  proposal: '제안',
  ordersuccess: '수주 성공',
  cancel: '취소',
};

export default function BusinessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [businesses, setBusiness] = useState<Business[]>([]);
  const [searchField, setSearchField] = useState('name'); // 검색타입
  const [searchValue, setSearchValue] = useState(''); // 검색값
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    // 검색필터 존재여부(새로고침시 사용)
    const searchField = searchParams.get('searchField') || 'name';
    const searchValue = searchParams.get('searchValue') || '';
    setSearchField(searchField);
    setSearchValue(searchValue);

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchBusiness = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;

        let url = `/api/business?page=${page}&limit=10`;
        if (searchValue) url += `&${searchField}=${searchValue}`;

        if (role === 'User') {
          url += `&role=User`;
        }
  
        const response = await fetch(url, { signal });
        const result = await response.json();
  
        if (!result.success) {
          throw new Error(result.message || '오류가 발생했습니다.');
        }
  
        setBusiness(result.data);
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
          alert('사업 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
    return () => controller.abort();
  }, [searchParams.toString()]);

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    try {
      const params = new URLSearchParams();
      if (searchValue.trim()) {
        params.set(searchField, searchValue.trim());
      }
      params.set('page', '1');
      params.set('searchField', searchField);
      params.set('searchValue', searchValue.trim());
      router.push(`/business?${params.toString()}`);
    } catch (error) {
      alert(error);
    }
  };

  // 초기화 버튼 클릭 핸들러
  const handleResetClick = () => {
    // setName('');
    router.push('/business?page=1');
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('searchField', searchField);
    params.set('searchValue', searchValue);
    router.push(`/business?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 관리</h1>
        <Link
          href="/business/register"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          사업 등록
        </Link>
      </div>

      {/* 검색 필터 */}
      <div className="mb-4 flex gap-2 flex-wrap justify-end items-center">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            setSearchValue(''); // 필드 변경 시 기존 값 초기화
          }}
          className="px-2 py-1 text-sm border rounded-md"
        >
          <option value="name">사업</option>
          <option value="manager_company">사업 담당자회사</option>
          <option value="customer_name">고객회사</option>
          <option value="status">사업 상태</option>
        </select>

        {/* 검색 입력 필드 */}
        {searchField === 'status' ? (
          <select
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md"
          >
            <option value="">전체</option>
            {Object.entries(statusMap).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchClick();
              }
            }}
            placeholder={
              searchField === 'name'
                ? '사업 입력'
                : searchField === 'manager_company'
                ? '사업 담당자회사 입력'
                : searchField === 'customer_name'
                ? '고객회사 입력'
                : ''
            }
            className="px-2 py-1 text-sm border rounded-md"
          />
        )}

        <button
          type="button"
          onClick={handleSearchClick}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>

        {/* <button
          type="button"
          onClick={() => {
            setSearchValue('');
            router.push('/support?page=1');
          }}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          초기화
        </button> */}
      </div>

      {/* 사업 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업 담당자 (회사)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                고객회사
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업 상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제품
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                노드수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                코어수
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업 시작일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업 종료일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 text-sm">
                  로딩 중...
                </td>
              </tr>
            ) : (
              businesses.map((business, index) => (
                <tr
                  key={business.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/business/${business.id}?page=${pagination.currentPage}&searchField=${searchField}&searchValue=${searchValue}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagination.totalItems - ((pagination.currentPage - 1) * pagination.itemsPerPage + index)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate block max-w-[300px]">
                    {business.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.manager_name} ({business.manager_company})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate block max-w-[200px]">
                    {business.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {statusMap[business.status] || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.product_name} (v{business.product_version})
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.node_cnt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.core_cnt}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.issued}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.expired}
                  </td>
                </tr>
              ))
            )}
            {!isLoading && businesses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 text-sm">
                  사업 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {businesses.length > 0 && (
        <div className="flex justify-center items-center mt-4">
          <div className="flex items-center gap-0">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>

            {/* 페이지 버튼 처리 */}
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
              disabled={pagination.currentPage >= pagination.totalPages}
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