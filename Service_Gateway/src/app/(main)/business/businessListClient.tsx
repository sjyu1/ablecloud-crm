'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Business {
  id: number;
  name: string;
  issued: string;
  expired: string;
  customer_name: string;
  status: string;
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

interface Props {
  businesses: Business[];
  pagination: Pagination;
  searchField: string;
  searchValue: string;
  role?: string;
}

export default function BusinessListClient({
  businesses,
  pagination,
  searchField: initialField,
  searchValue: initialValue,
  role,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchField, setSearchField] = useState(initialField);
  const [searchValue, setSearchValue] = useState(initialValue);

  const isLoading = false;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchValue.trim()) {
      params.set(searchField, searchValue.trim());
    }
    params.set('page', '1');
    params.set('searchField', searchField);
    params.set('searchValue', searchValue.trim());

    router.push(`/business?${params.toString()}`);
  };

  const handleReset = () => {
    router.push('/business?page=1');
    setSearchField('name');
    setSearchValue('');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('searchField', searchField);
    params.set('searchValue', searchValue);
    router.push(`/business?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 검색 필터 */}
      <div className="flex gap-2 flex-wrap justify-end items-center">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            setSearchValue('');
          }}
          className="px-2 py-1 text-sm border rounded-md"
        >
          <option value="name">사업</option>
          <option value="manager_company">담당자 회사</option>
          <option value="customer_name">고객회사</option>
          <option value="status">상태</option>
        </select>

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
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder={
              searchField === 'name'
                ? '사업 입력'
                : searchField === 'manager_company'
                ? '담당자회사 입력'
                : '고객회사 입력'
            }
            className="px-2 py-1 text-sm border rounded-md"
          />
        )}

        <button
          onClick={handleSearch}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          초기화
        </button>
      </div>

      {/* 테이블 */}
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
                담당자 (회사)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                고객회사
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제품
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                시작일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                종료일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 text-sm">
                  사업 정보가 없습니다.
                </td>
              </tr>
            ) : (
              businesses.map((b, idx) => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(`/business/${b.id}?page=${pagination.currentPage}&searchField=${searchField}&searchValue=${searchValue}`)
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagination.totalItems - ((pagination.currentPage - 1) * pagination.itemsPerPage + idx)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{b.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {b.manager_name} ({b.manager_company})
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {statusMap[b.status] || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {b.product_name} (v{b.product_version})
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.issued}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.expired}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 UI */}
      {businesses.length > 0 && (
        <div className="flex justify-center items-center mt-4 space-x-1">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            &lt;
          </button>

          {(() => {
            const pages = [];
            const { currentPage, totalPages } = pagination;

            const pushPage = (num: number) => {
              if (num === currentPage) {
                pages.push(
                  <button
                    key={num}
                    disabled
                    className="px-3 py-1 border rounded bg-blue-500 text-white"
                  >
                    {num}
                  </button>
                );
              } else {
                pages.push(
                  <button
                    key={num}
                    onClick={() => handlePageChange(num)}
                    className="px-3 py-1 border rounded hover:bg-gray-200"
                  >
                    {num}
                  </button>
                );
              }
            };

            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pushPage(i);
            } else {
              if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) pushPage(i);
                pages.push(<span key="e1">...</span>);
              } else if (currentPage >= totalPages - 2) {
                pages.push(<span key="e1">...</span>);
                for (let i = totalPages - 4; i <= totalPages; i++) pushPage(i);
              } else {
                pages.push(<span key="e1">...</span>);
                for (let i = currentPage - 2; i <= currentPage + 2; i++) pushPage(i);
                pages.push(<span key="e2">...</span>);
              }
            }

            return pages;
          })()}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            &gt;
          </button>

          <span className="ml-4 text-sm text-gray-600">
            전체 {pagination.totalItems}개 항목
          </span>
        </div>
      )}
    </div>
  );
}
