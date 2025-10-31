'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Notice {
  id: number;
  title: string;
  writer: string;
  level: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface NoticeListClientProps {
  notices: Notice[];
  pagination: Pagination;
  searchField: string;
  searchValue: string;
  role?: string;
}

export default function NoticeListClient({
  notices,
  pagination: pagination,
  searchField: initialSearchField,
  searchValue: initialSearchValue,
  role,
}: NoticeListClientProps) {
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
    router.push(`/notice?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchField('title');
    setSearchValue('');
    router.push('/notice?page=1');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    params.set('searchField', searchField);
    params.set('searchValue', searchValue.trim());
    router.push(`/notice?${params.toString()}`);
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
          <option value="title">제목</option>
          <option value="level">등급</option>
        </select>

        {searchField === 'level' ? (
          <select
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md"
          >
            <option value="">전체</option>
            <option value="ALL">ALL</option>
            <option value="PLATINUM">PLATINUM</option>
            <option value="GOLD">GOLD</option>
            <option value="SILVER">SILVER</option>
            <option value="VAR">VAR</option>
          </select>
        ) : (
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchClick();
            }}
            placeholder="제목 입력"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-4">
                  공지사항이 없습니다.
                </td>
              </tr>
            ) : (
              notices.map((notice, idx) => (
                <tr
                  key={notice.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/notice/${notice.id}?page=${pagination.currentPage}&searchField=${searchField}&searchValue=${searchValue}`
                    )
                  }
                >
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pagination.totalItems -
                      ((pagination.currentPage - 1) * pagination.itemsPerPage + idx)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{notice.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{notice.writer}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{notice.level}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {format(notice.created, 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {notices.length > 0 && (
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

              const createBtn = (num: number) =>
                num === current ? (
                  <button
                    key={num}
                    disabled
                    className="px-2 py-1 text-sm border rounded bg-blue-500 text-white font-bold cursor-default"
                  >
                    {num}
                  </button>
                ) : (
                  <span
                    key={num}
                    onClick={() => handlePageChange(num)}
                    className="px-3 py-2 text-sm cursor-pointer text-gray-700 hover:text-blue-500"
                  >
                    {num}
                  </span>
                );

              if (total <= 5) {
                for (let i = 1; i <= total; i++) pages.push(createBtn(i));
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
