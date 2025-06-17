'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../store/authStore';
import Link from 'next/link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface User {
  id: string,
  username: string;
  email: string;
  firstName: string;
  // lastName: string;
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function tabProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function UserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [searchField, setSearchField] = useState('name'); // 검색타입
  const [searchValue, setSearchValue] = useState(''); // 검색값
  const [productId, setProductId] = useState('');
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  let prevType = searchParams.get('type');
  let tab_type = 0
  if (prevType == 'partner') tab_type = 0
  else if (prevType == 'customer') tab_type = 1
  else if (prevType == 'vendor') tab_type = 2
  const initialTab = tab_type;
  const [value, setValue] = useState(initialTab);
  const type = searchParams.get('type') || 'partner';

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);
    const username = getCookie('username');
    setUsername(username ?? undefined);

    // 검색필터 존재여부(새로고침시 사용)
    const searchField = searchParams.get('searchField') || 'username';
    const searchValue = searchParams.get('searchValue') || '';
    setSearchField(searchField);
    setSearchValue(searchValue);

    // if (role === 'User') {
    //   setValue(1); // 기본값을 '파트너' 탭으로 설정
    // }

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchUsers = async () => {
      try {
        const page = Number(searchParams.get('page')) || 1;

        let url = `/api/user?page=${page}&limit=${pagination.itemsPerPage}`;
        if (searchValue) url += `&${searchField}=${searchValue}`;

        if (role == 'User') {
          url += `&role=User&username=`+username;
        }
        if (type) {
          url += `&type=${type}`;
        }
  
        const response = await fetch(url, { signal });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || '오류가 발생했습니다.');
        }

        setUsers(result.data);
        setPagination(prev => ({
          ...prev,
          totalItems: result.pagination.totalItems,
          totalPages: result.pagination.totalPages,
          currentPage: result.pagination.currentPage,
        }));
      } catch (err) {
        if (err instanceof Error) {
          if (err.message == 'Failed to fetch user information') {
            logoutIfTokenExpired(); // 토큰 만료시 로그아웃
          }
        } else {
          alert('사용자 목록 조회에 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [searchParams.toString()]);

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    try {
      const params = new URLSearchParams();
      if (searchValue.trim()) {
        params.set(searchField, searchValue.trim());
      }
      params.set('page', '1');
      params.set('searchField', searchField);
      params.set('searchValue', searchValue.trim());
      params.set('type', type);

      // URL 업데이트
      router.push(`/user?${params.toString()}`);
    } catch (error) {
      // alert('검색 중 오류가 발생했습니다.');
      alert(error);
    }
  };

  // 초기화 버튼 클릭 핸들러
  const handleResetClick = () => {
    // setProductId('');
    router.push('/user?page=1');
  };

  // 탭 핸들러
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    let type = 'partner'
    if (newValue == 0) type = 'partner'
    else if (newValue == 1) type = 'customer'
    else if (newValue == 2) type = 'vendor'

    const params = new URLSearchParams(searchParams.toString());

    params.delete('type');
    params.set('type', type);
    params.set('page', '1');
    router.push(`/user?${params.toString()}`);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('searchField', searchField);
    params.set('searchValue', searchValue);
    router.push(`/user?${params.toString()}`);
  };

  // 렌더링 데이터
  const renderPartnerTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NO
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              아이디
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이메일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이름
            </th>
            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              성
            </th> */}
            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              타입
            </th> */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              company
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500 text-sm">
                로딩 중...
              </td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/user/${user.id}?page=${pagination.currentPage}&type=${prevType=prevType==null?'partner':prevType}&searchField=${searchField}&searchValue=${searchValue}`)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pagination.totalItems - ((pagination.currentPage - 1) * pagination.itemsPerPage + index)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.username}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.firstName}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastName}
                </td> */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.type}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.company}
                </td>
              </tr>
            ))
          )}
          {!isLoading && users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500 text-sm">
                사용자 정보가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사용자 관리</h1>
        <Link
          href="/user/register"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          // style={{ display: role === 'Admin' ? '' : 'none' }}
        >
          사용자 등록
        </Link>
      </div>

      {/* 검색 필터 */}
      <div className="mb-4 flex gap-2 flex-wrap justify-end items-center">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            setSearchValue(''); // 필드 변경 시 기존 값 초기화
          }}
          className="px-2 py-1 text-sm border rounded-md"
        >
          <option value="username">아이디</option>
          <option value="firstName">이름</option>
          <option value="company">COMPANY</option>
        </select>

        {/* 검색 입력 필드 */}
        {
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchClick();
              }
            }}
            placeholder={
              searchField === 'username'
                ? '아이디 입력'
                : searchField === 'firstName'
                ? '이름 입력'
                : searchField === 'company'
                ? 'COMPANY 입력'
                : ''
            }
            className="px-2 py-1 text-sm border rounded-md"
          />
        }

        <button
          type="button"
          onClick={handleSearchClick}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>

        {/* <button
          type="button"
          onClick={() => {
            setSearchValue('');
            router.push('/support?page=1');
          }}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          초기화
        </button> */}
      </div>

      {/* 사용자 목록 */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="partner" {...tabProps(0)} />
          <Tab label="customer" {...tabProps(1)} />
          {/* <Tab label="vendor" {...tabProps(2)} disabled={role !== 'Admin'}/> */}
          {role !== 'User' && <Tab label="vendor" {...tabProps(2)} />}
        </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          {renderPartnerTable()}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          {renderPartnerTable()}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          {renderPartnerTable()}
        </CustomTabPanel>
      </Box>

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