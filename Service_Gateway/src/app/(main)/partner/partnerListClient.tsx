'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

interface Partner {
  id: number;
  name: string;
  telnum: string;
  level: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Props {
  partners: Partner[];
  pagination: Pagination;
  role: string;
  level: string;
  searchValue: string;
  currentPage: number;
}

export default function PartnerListClient({
  partners,
  pagination,
  role,
  level,
  searchValue,
  currentPage
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchValue);
  const [searchType, setSearchType] = useState('name');
  const [tabValue, setTabValue] = useState(level || 'PLATINUM');

  const levels = ['PLATINUM', 'GOLD', 'SILVER', 'VAR'];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set('searchValue', searchInput.trim());
      params.set('searchType', searchType);
    }
    params.set('level', tabValue);
    params.set('page', '1');
    router.push(`/partner?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchType('name');
    setTabValue('PLATINUM');
    router.push('/partner?page=1&level=PLATINUM');
  };

  const handleTabClick = (level: string) => {
    setTabValue(level);
    const params = new URLSearchParams(searchParams.toString());
    params.set('level', level);
    params.set('page', '1');
    if (searchInput.trim()) {
      params.set('searchValue', searchInput.trim());
      params.set('searchType', searchType);
    }
    router.push(`/partner?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('level', tabValue);
    if (searchInput.trim()) {
      params.set('searchValue', searchInput.trim());
      params.set('searchType', searchType);
    }
    router.push(`/partner?${params.toString()}`);
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
          <option value="name">회사명</option>
          <option value="telnum">전화번호</option>
          <option value="level">등급</option>
        </select>

        {searchType === 'level' ? (
          <select
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md"
          >
            <option value="">전체</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
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

      {/* 탭: role !== 'User' 인 경우만 노출 */}
      {role !== 'User' && (
        <div className="flex border-b border-gray-300">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleTabClick(lvl)}
              className={`px-5 py-2 text-base font-medium -mb-px border-b-2 transition-colors duration-200 ${
                tabValue === lvl
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}


      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NO
              </th>
              <th className="w-[300px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회사명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                전화번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                등급
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 text-sm">
                  파트너 정보가 없습니다.
                </td>
              </tr>
            ) : (
              partners.map((p, idx) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/partner/${p.id}?page=${pagination.currentPage}&level=${tabValue}&searchValue=${searchInput}`
                    )
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagination.totalItems - ((pagination.currentPage - 1) * pagination.itemsPerPage + idx)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.telnum}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.level}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(p.created), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {partners.length > 0 && (
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
