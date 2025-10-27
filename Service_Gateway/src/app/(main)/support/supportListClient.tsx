'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Support {
  id: number;
  customer_id: string;
  customer: string;
  business_id: string;
  business: string;
  issued: string;
  type: string;
  issue: string;
  solution: string;
  actioned: string;
  action_type: string;
  manager: string;
  status: string;
  note: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface SupportListClientProps {
  supports: Support[];
  pagination: Pagination;
  searchField: string;
  searchValue: string;
  role?: string;
}

export default function SupportListClient({
  supports: supports,
  pagination: pagination,
  searchField: initialSearchField,
  searchValue: initialSearchValue,
  role,
}: SupportListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchField, setSearchField] = useState(initialSearchField);
  const [searchValue, setSearchValue] = useState(initialSearchValue);

  const handleSearchClick = () => {
    const params = new URLSearchParams();
    if (searchValue.trim()) {
      params.set(searchField, searchValue.trim());
    }
    params.set('page', '1');
    params.set('searchField', searchField);
    params.set('searchValue', searchValue.trim());
    router.push(`/support?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    params.set('searchField', searchField);
    params.set('searchValue', searchValue);
    router.push(`/support?${params.toString()}`);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consult': return '기술상담';
      case 'technical': return '기술지원';
      case 'incident': return '장애지원';
      case 'poc': return 'PoC';
      case 'other': return '기타';
      default: return 'Unknown';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processing': return '처리중';
      case 'complete': return '완료';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* 검색 필터 */}
      <div className="mb-4 flex gap-2 flex-wrap justify-end items-center">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            setSearchValue('');
          }}
          className="px-2 py-1 text-sm border rounded-md"
        >
          <option value="name">고객</option>
          <option value="type">구분</option>
          <option value="manager">담당자</option>
          <option value="status">완료여부</option>
        </select>

        {searchField === 'type' ? (
          <select
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md"
          >
            <option value="">구분 전체</option>
            <option value="consult">기술상담</option>
            <option value="technical">기술지원</option>
            <option value="incident">장애지원</option>
            <option value="poc">PoC</option>
            <option value="other">기타</option>
          </select>
        ) : searchField === 'status' ? (
          <select
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md"
          >
            <option value="">완료여부 전체</option>
            <option value="processing">처리중</option>
            <option value="complete">완료</option>
          </select>
        ) : (
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchClick();
            }}
            placeholder={
              searchField === 'name'
                ? '고객 입력'
                : searchField === 'manager'
                ? '담당자 입력'
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
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청내역</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">완료여부</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {supports.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-4 text-center text-gray-500 text-sm"
                >
                  기술지원 정보가 없습니다.
                </td>
              </tr>
            ) : (
              supports.map((support, idx) => (
                <tr
                  key={support.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/support/${support.id}?page=${pagination.currentPage}&searchField=${searchField}&searchValue=${searchValue}`
                    )
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagination.totalItems -
                      ((pagination.currentPage - 1) * pagination.itemsPerPage + idx)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {support.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {support.issued}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTypeLabel(support.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 whitespace-pre-line">
                    {support.issue}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[200px]"
                    title={support.manager}
                  >
                    {support.manager}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusLabel(support.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {supports.length > 0 && (
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
              const pages: React.ReactNode[] = [];
              const total = pagination.totalPages;
              const current = pagination.currentPage;

              const createBtn = (num: number) => {
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
                  pages.push(createBtn(i));
                }
              } else {
                if (current <= 3) {
                  for (let i = 1; i <= 5; i++) pages.push(createBtn(i));
                  pages.push(<span key="e1" className="text-sm px-2 text-gray-500">...</span>);
                } else if (current >= total - 2) {
                  pages.push(<span key="e1" className="text-sm px-2 text-gray-500">...</span>);
                  for (let i = total - 4; i <= total; i++) pages.push(createBtn(i));
                } else {
                  pages.push(<span key="e1" className="text-sm px-2 text-gray-500">...</span>);
                  for (let i = current - 2; i <= current + 2; i++) pages.push(createBtn(i));
                  pages.push(<span key="e2" className="text-sm px-2 text-gray-500">...</span>);
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

