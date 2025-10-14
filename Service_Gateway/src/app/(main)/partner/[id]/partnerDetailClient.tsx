'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

interface Partner {
  id: number;
  name: string;
  telnum: string;
  level: string;
  deposit: string;
  credit: string;
  created: string;
  product_category_names: string;
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
  partner: Partner | null;
  users: User[];
  role?: string;
  params: { id: string };
  searchParams: { page?: string; level?: string; searchValue?: string };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function PartnerTabPanel({ children, index, value }: TabPanelProps) {
  return (
    <div hidden={value !== index} role="tabpanel" id={`tabpanel-${index}`}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PartnerDetailClient({
  partner,
  users,
  role,
  params,
  searchParams,
}: Props) {
  const router = useRouter();
  const prevPage = searchParams.page ?? '1';
  const prevLevel = searchParams.level ?? 'PLATINUM';
  const prevSearchValue = searchParams.searchValue ?? '';

  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 파트너를 삭제하시겠습니까?')) {
      return;
    }
    if (users.length > 0) {
      alert('파트너 담당자가 존재합니다. 파트너 담당자를 삭제하세요.');
      return;
    }
    const response = await fetch(`/api/partner/${partner?.id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      alert('파트너가 삭제되었습니다.');
      router.push(
        `/partner?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`
      );
    } else {
      const data = await response.json();
      alert(data.message || '파트너 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() =>
              router.push(
                `/partner/${partner?.id}/edit?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`
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
                `/partner?page=${prevPage}&level=${prevLevel}&searchValue=${prevSearchValue}`
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
          <Tabs value={value} onChange={handleChange} aria-label="partner tabs">
            <Tab label="상세정보" />
            <Tab label="담당자" />
          </Tabs>
        </Box>
        <PartnerTabPanel value={value} index={0}>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">회사</h3>
                  <p className="mt-1 text-lg text-gray-900">{partner?.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
                  <p className="mt-1 text-lg text-gray-900">{partner?.telnum}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">등급</h3>
                  <p className="mt-1 text-lg text-gray-900">{partner?.level}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">사용 제품 카테고리</h3>
                  <p className="mt-1 text-lg text-gray-900">{partner?.product_category_names}</p>
                </div>
                {(partner?.deposit || partner?.credit) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">크레딧(구매 | 사용 | 잔여 코어수)</h3>
                    <p className="mt-1 text-lg text-gray-900">
                      {partner?.deposit ?? '-'} | {partner?.credit ?? '-'} |{' '}
                      <span
                        className={
                          Number(partner?.deposit) - Number(partner?.credit) < 0
                            ? 'text-red-500 font-bold'
                            : ''
                        }
                      >
                        {Number(partner?.deposit) - Number(partner?.credit)}
                      </span>
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                  <p className="mt-1 text-lg text-gray-900">{partner?.created}</p>
                </div>
              </div>
            </div>
          </div>
        </PartnerTabPanel>

        <PartnerTabPanel value={value} index={1}>
          <table className="min-w-full divide-y divide-gray-200 border-b border-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/user/${user.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.telnum}</td>
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
        </PartnerTabPanel>
      </Box>
    </div>
  );
}
