'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  type: string;
  role: string;
  company: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Props {
  users: User[];
  pagination: Pagination;
  role: string;
  type: string;
  searchField: string;
  searchValue: string;
  currentPage: number;
}

export default function UserListClient({
  users,
  pagination,
  role,
  type,
  searchField,
  searchValue,
  currentPage,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchValue);
  const [searchType, setSearchType] = useState(searchField || 'username');
  const [tabValue, setTabValue] = useState(type || 'partner');

  const types = ['partner', 'customer', 'vendor'];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set('searchField', searchType);
      params.set('searchValue', searchInput.trim());
    }
    params.set('type', tabValue);
    params.set('page', '1');
    router.push(`/user?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchType('username');
    setTabValue('partner');
    router.push('/user?page=1&type=partner');
  };

  const handleTabClick = (t: string) => {
    setTabValue(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', t);
    params.set('page', '1');
    if (searchInput.trim()) {
      params.set('searchField', searchType);
      params.set('searchValue', searchInput.trim());
    }
    router.push(`/user?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('type', tabValue);
    if (searchInput.trim()) {
      params.set('searchField', searchType);
      params.set('searchValue', searchInput.trim());
    }
    router.push(`/user?${params.toString()}`);
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
          <option value="username">아이디</option>
          <option value="firstName">이름</option>
          <option value="company">회사</option>
        </select>

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
      {types
        .filter((t) => !(t === 'vendor' && role === 'User')) // Admin 권한만 vendor탭 조회
        .map((t) => (
          <button
            key={t}
            onClick={() => handleTabClick(t)}
            className={`px-5 py-2 text-base font-medium -mb-px border-b-2 transition-colors duration-200 ${
              tabValue === t
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
    </div>


      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">권한</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 text-sm">
                  사용자 정보가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/user/${user.id}?page=${pagination.currentPage}&type=${tabValue}&searchField=${searchType}&searchValue=${searchInput}`
                    )
                  }
                >
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pagination.totalItems - ((pagination.currentPage - 1) * pagination.itemsPerPage + idx)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.firstName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.company}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {users.length > 0 && (
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