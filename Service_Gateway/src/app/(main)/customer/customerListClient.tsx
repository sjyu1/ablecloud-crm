'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

interface Customer {
  id: number;
  name: string;
  telnum: string;
  created: string;
  manager_name: string;
  manager_company: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Props {
  customers: Customer[];
  pagination: Pagination;
  role?: string;
  searchField?: string;
  searchValue?: string;
  currentPage: number;
}

export default function CustomerListClient({
  customers,
  pagination,
  role,
  searchField = 'name',
  searchValue = '',
  currentPage,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchValue);
  const [searchType, setSearchType] = useState(searchField);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set('searchValue', searchInput.trim());
      params.set('searchField', searchType);
    }
    params.set('page', '1');
    router.push(`/customer?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchType('name');
    router.push('/customer?page=1');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    if (searchInput.trim()) {
      params.set('searchField', searchType);
      params.set('searchValue', searchInput.trim());
    }
    router.push(`/customer?${params.toString()}`);
  };

  return (
    <div className="space-y-4">

      {/* 검색 */}
      <div className="flex gap-2 flex-wrap justify-end items-center">
        <select
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value);
            setSearchInput('');
          }}
          className="px-2 py-1 text-sm border rounded-md"
        >
          <option value="name">회사</option>
          <option value="manager_company">고객 관리 파트너 회사</option>
        </select>

        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder={
            searchType === 'name'
              ? '회사 입력'
              : '고객 관리 파트너 회사 입력'
          }
          className="px-2 py-1 text-sm border rounded-md"
        />

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객 관리 파트너 (회사)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 text-sm">
                  고객 정보가 없습니다.
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/customer/${customer.id}?page=${pagination.currentPage}&searchField=${searchType}&searchValue=${searchInput}`
                    )
                  }
                >
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pagination.totalItems -
                      ((pagination.currentPage - 1) * pagination.itemsPerPage + index)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.telnum}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.manager_name} ({customer.manager_company})
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(customer.created), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {customers.length > 0 && (
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
