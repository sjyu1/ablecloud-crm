'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface Props {
  licenses: License[];
  pagination: Pagination;
  trial: string;
  searchField: string;
  searchValue: string;
  currentPage: number;
  role?: string;
}

export default function LicenseListClient({
  licenses,
  pagination,
  trial,
  searchField,
  searchValue,
  currentPage,
  role,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchValue);
  const [searchType, setSearchType] = useState(searchField);
  const [tabValue, setTabValue] = useState(trial);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput) {
      params.set('searchField', searchType);
      params.set('searchValue', searchInput.trim());
    }
    params.set('trial', tabValue);
    params.set('page', '1');
    router.push(`/license?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchType('business_name');
    setTabValue('0');
    router.push('/license?page=1');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('trial', tabValue);
    if (searchInput) {
      params.set('searchField', searchType);
      params.set('searchValue', searchInput.trim());
    }
    router.push(`/license?${params.toString()}`);
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
          <option value="business_name">사업</option>
          <option value="license_key">라이선스 키</option>
          <option value="status">상태</option>
        </select>

        {searchType === 'status' ? (
          <select
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md"
          >
            <option value="">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        ) : (
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="검색어 입력"
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

      {/* 탭 */}
      <div className="flex border-b border-gray-300">
        {['0', '1'].map((val, idx) => (
          <button
            key={val}
            onClick={() => {
              setTabValue(val);
              const params = new URLSearchParams();
              if (searchInput) {
                params.set('searchField', searchType);
                params.set('searchValue', searchInput.trim());
              }
              params.set('trial', val);
              params.set('page', '1');
              router.push(`/license?${params.toString()}`);
            }}
            className={`px-5 py-2 text-base font-medium -mb-px border-b-2 transition-colors duration-200 ${
              tabValue === val
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'
            }`}
          >
            {idx === 0 ? '일반' : 'TRIAL'}
          </button>
        ))}
      </div>


      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NO
              </th>
              <th className="w-[300px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                라이선스 키
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제품
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                발급자
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
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 text-sm">
                  라이선스 정보가 없습니다.
                </td>
              </tr>
            ) : (
              licenses.map((l, idx) => (
                <tr
                  key={l.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/license/${l.id}?page=${pagination.currentPage}&searchField=${searchType}&searchValue=${searchInput}&trial=${tabValue}`
                    )
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagination.totalItems - ((pagination.currentPage - 1) * pagination.itemsPerPage + idx)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{l.business_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.license_key}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      l.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {l.status === 'active' ? '활성' : l.status === 'inactive' ? '비활성' : l.status}
                  </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {l.product_name} (v{l.product_version})
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.issued_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.issued}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.expired}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 UI */}
      {licenses.length > 0 && (
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
