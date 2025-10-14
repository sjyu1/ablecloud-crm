'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

interface Customer {
  id: number;
  name: string;
  telnum: string;
  created: string;
  business_id: string;
  business_name: string;
  business_node_cnt: string;
  business_core_cnt: string;
  business_status: string;
  business_issued: string;
  business_expired: string;
  manager_name: string;
  manager_company: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  telnum: string;
}

interface Props {
  customer: Customer | null;
  users: User[];
  role?: string;
  params: { id: string };
  searchParams: { page?: string; level?: string; searchField?: string; searchValue?: string };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, index, value }: TabPanelProps) {
  return (
    <div hidden={value !== index} role="tabpanel" id={`tabpanel-${index}`}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CustomerDetailClient({
  customer,
  users,
  role,
  params,
  searchParams,
}: Props) {
  const router = useRouter();
  const prevPage = searchParams.page ?? '1';
  const prevLevel = searchParams.level ?? 'PLATINUM';
  const prevSearchField = searchParams.searchField || 'name';
  const prevSearchValue = searchParams.searchValue ?? '';

  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 고객을 삭제하시겠습니까?')) {
      return;
    }
    if (users.length > 0) {
      alert('고객 담당자가 존재합니다. 고객 담당자를 삭제하세요.');
      return;
    }
    const response = await fetch(`/api/customer/${customer?.id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      alert('고객이 삭제되었습니다.');
      router.push(
        `/customer?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`
      );
    } else {
      const data = await response.json();
      alert(data.message || '고객 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">고객 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() =>
              router.push(
                `/customer/${customer?.id}/edit?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`
              )
            }
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600' : 'hidden'}
          >
            삭제
          </button>
          <button
            onClick={() =>
              router.push(
                `/customer?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`
              )
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            목록
          </button>
        </div>
      </div>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="상세정보" />
            <Tab label="담당자" />
            <Tab label="사업정보" />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">회사</h3>
                <p className="mt-1 text-lg text-gray-900">
                {customer?.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
                <p className="mt-1 text-lg text-gray-900">
                {customer?.telnum}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">고객 관리 파트너 (회사)</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {customer?.manager_name} ({customer?.manager_company})
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p className="mt-1 text-lg text-gray-900">{customer?.created}</p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        <table className="min-w-full divide-y divide-gray-200 border-b border-gray-100">
          <thead className="bg-gray-50">
            <tr>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                전화번호
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/user/${user.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.telnum}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                  사용자 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
        {customer?.business_name ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업</h3>
                <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                  <a href={`/business/${customer.business_id}`} target="_self" rel="noopener noreferrer">
                    {customer.business_name}
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업상태</h3>
                <p className="mt-1 text-lg text-gray-900">
                {customer.business_status === 'standby' ? ('대기 중') : customer.business_status === 'meeting' ? ('고객 미팅') : customer.business_status === 'poc' ? ('PoC') :customer.business_status === 'bmt' ? ('BMT') :customer.business_status === 'ordering' ? ('발주') :customer.business_status === 'proposal' ? ('제안') :customer.business_status === 'ordersuccess' ? ('수주 성공') :customer.business_status === 'cancel' ? ('취소') : ('Unknown Type')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">노드수</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {customer.business_node_cnt}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">코어수</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {customer.business_core_cnt}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 시작일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {customer.business_issued}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 종료일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {customer.business_expired}
                </p>
              </div>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">사업 정보가 없습니다.</h3>
            </div>
          </div>
        </div>
        )}
        </CustomTabPanel>
      </Box>
    </div>
  );
}
