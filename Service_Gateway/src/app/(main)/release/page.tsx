'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../store/authStore';
import Link from 'next/link';
import { format } from 'date-fns';

interface Release {
  id: number;
  version: string;
  contents: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ReleasePage() {
  const [releases, setReleases] = useState<Release[]>([]);
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

    const fetchReleases = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;
        const currentName = searchParams.get('name');
        
        let totalUrl = `/api/release?page=1&limit=1000`;
        if (currentName) {
          totalUrl += `&name=${currentName}`;
        }
        
        const totalResponse = await fetch(totalUrl);
        const totalResult = await totalResponse.json();
        const totalCount = totalResult.data ? totalResult.data.length : 0;

        // 현재 페이지 데이터 가져오기
        // let url = `/api/release?page=${page}&limit=10`;
        // if (currentName) {
        //   url += `&name=${currentName}`;
        // }
        // if (role === 'User') {
        //   url += `&role=User`;
        // }

        // const response = await fetch(url);
        // const result = await response.json();

        if (!totalResult.success) {
          throw new Error(totalResult.message || '오류가 발생했습니다.');
        }

        // 현재 페이지의 데이터 설정
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const pageData = totalResult.data.slice(startIndex, endIndex);
        setReleases(pageData);

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
          alert('릴리즈노트 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, [searchParams, pagination.itemsPerPage]);

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    try {
      const params = new URLSearchParams();
      if (name.trim()) {  // 공백 제거 후 체크
        params.set('version', name.trim());
      }
      params.set('page', '1');

      // URL 업데이트
      router.push(`/release?${params.toString()}`);
    } catch (error) {
      // alert('검색 중 오류가 발생했습니다.');
      alert(error);
    }
  };

  // 초기화 버튼 클릭 핸들러
  const handleResetClick = () => {
    setName('');
    router.push('/release?page=1');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/release?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">릴리즈노트</h1>
        <Link
          href="/release/register"
          className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
        >
          릴리즈노트 등록
        </Link>
      </div>

      {/* 검색 필터 */}
      <div className="mb-4 flex gap-2 justify-end">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="제품버전으로 검색"
          className="px-2 py-1 text-sm border rounded-md"
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
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>
        {searchParams.get('name') && (
          <button
            type="button"
            onClick={handleResetClick}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            초기화
          </button>
        )}
      </div>

      {/* 릴리즈노트 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제품버전
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제품버전
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
              {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500 text-sm">
                  로딩 중...
                </td>
              </tr>
            ) : (
              releases.map((release) => (
                <tr key={release.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/release/${release.id}?page=${pagination.currentPage}`)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {release.version}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {release.name}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(release.created, 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/release/${release.id}`}
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
            {!isLoading && releases.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500 text-sm">
                  릴리즈노트 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {releases.length > 0 && (
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
              disabled={!hasNextPage}
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
