'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

interface Product {
  id: number;
  name: string;
  version: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Props {
  products: Product[];
  pagination: Pagination;
  searchField: string;
  searchValue: string;
  role?: string;
}

export default function ProductListClient({
  products,
  pagination,
  searchField: initialField,
  searchValue: initialValue,
  role,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchField, setSearchField] = useState(initialField);
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchValue.trim()) {
      params.set(searchField, searchValue.trim());
    }
    params.set('page', '1');
    params.set('searchField', searchField);
    params.set('searchValue', searchValue.trim());
    console.log(params.toString())
    router.push(`/product?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchField('name');
    setSearchValue('');
    router.push('/product?page=1');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('searchField', searchField);
    params.set('searchValue', searchValue.trim());
    router.push(`/product?${params.toString()}`);
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
          <option value="name">제품명</option>
          {/* <option value="version">제품버전</option> */}
        </select>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder={
            searchField === 'name' ? '제품명 입력' : '제품버전 입력'
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제품명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                버전
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-gray-500 text-sm"
                >
                  제품 정보가 없습니다.
                </td>
              </tr>
            ) : (
              products.map((product, idx) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/product/${product.id}?page=${pagination.currentPage}&searchField=${searchField}&searchValue=${searchValue}`
                    )
                  }
                >
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pagination.totalItems -
                      ((pagination.currentPage - 1) * pagination.itemsPerPage +
                        idx)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.version}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(product.created), 'yyyy-MM-dd')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {products.length > 0 && (
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
                for (let i = currentPage - 2; i <= currentPage + 2; i++)
                  pushPage(i);
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
