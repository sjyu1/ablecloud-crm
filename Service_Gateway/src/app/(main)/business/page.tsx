'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../store/authStore';
import Link from 'next/link';
import { format } from 'date-fns';

interface Business {
  id: number;
  name: string;
  issued: string;
  expired: string;
  customer_name: string;
  status: string;
  node_cnt: string;
  core_cnt:string;
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

export default function BusinessPage() {
  const [businesses, setBusiness] = useState<Business[]>([]);
  const [name, setName] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [hasNextPage, setHasNextPage] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    const fetchBusiness = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;
        const currentName = searchParams.get('name');
        
        // 전체 사업 목록을 가져오는 API 호출
        let totalUrl = `/api/business?page=1&limit=10000`;
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
        let url = `/api/business?page=${page}&limit=10`;
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
        setBusiness(pageData);
        
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
          alert('사업 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [searchParams, pagination.itemsPerPage]);

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    try {
      const params = new URLSearchParams();
      if (name.trim()) {  // 공백 제거 후 체크
        params.set('name', name.trim());
      }
      params.set('page', '1');

      // URL 업데이트
      router.push(`/business?${params.toString()}`);
    } catch (error) {
      // alert('검색 중 오류가 발생했습니다.');
      alert(error);
    }
  };

  // 초기화 버튼 클릭 핸들러
  const handleResetClick = () => {
    setName('');
    router.push('/business?page=1');
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
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
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="사업명으로 검색"
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
        {searchParams.get('name') && (
          <button
            type="button"
            onClick={handleResetClick}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            초기화
          </button>
        )}
      </div>

      {/* 사업 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업명
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
                제품명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                노드수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                코어수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업 시작일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업 종료일
              </th>
              {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : (
              businesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/business/${business.id}?page=${pagination.currentPage}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.manager_name} ({business.manager_company})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.status === 'standby' ? ('대기 중') : business.status === 'meeting' ? ('고객 미팅') : business.status === 'poc' ? ('PoC') :business.status === 'bmt' ? ('BMT') :business.status === 'ordering' ? ('발주') :business.status === 'proposal' ? ('제안') :business.status === 'ordersuccess' ? ('수주 성공') :business.status === 'cancel' ? ('취소') : ('Unknown Type')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.product_name} (v{business.product_version})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.node_cnt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.core_cnt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(business.issued, 'yyyy-MM-dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(business.expired, 'yyyy-MM-dd')}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/business/${business.id}`}
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
            {!isLoading && businesses.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  사업 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {businesses.length > 0 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <span className="px-4">
          {pagination.currentPage} / {pagination.totalPages} 페이지
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!hasNextPage}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* 총 아이템 수 */}
      {<div className="text-center mt-2 text-gray-600">
        총 {pagination.totalItems}개의 사업
      </div>}
    </div>
  );
} 
