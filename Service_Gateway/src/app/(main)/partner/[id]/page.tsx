'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface Partner {
  id: number;
  name: string;
  telnum: string;
  level: string;
  created: string;
}

interface User {
  id: string,
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  type: string;
  telnum:string;
  role: string;
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

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);

  const [users, setUsers] = useState<User[]>([])
  const [value, setValue] = useState(0);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchPartnerDetail();
    fetchPartnerUserDetail();
  }, []);

  const fetchPartnerDetail = async () => {
    try {
      const response = await fetch(`/api/partner/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '파트너 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setPartner(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      // if (err instanceof Error) {
      //   if (err.message == 'Failed to fetch user information') {
      //     logoutIfTokenExpired(); // 토큰 만료시 로그아웃
      //   }
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPartnerUserDetail = async () => {
    try {
      const response = await fetch(`/api/user/forManager?type=partner&company_id=${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '파트너 담당자 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        setError(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        // alert(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setUsers(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      if (err instanceof Error) {
        if (err.message == 'Failed to fetch user information') {
          setIsLoggedOut(true);
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 파트너를 삭제하시겠습니까?')) {
      return;
    }

    if (users.length > 0) {
      alert('파트너 담당자가 존재합니다. 파트너 담당자를 삭제하세요.');
      return;
    }

    try {
      const response = await fetch(`/api/partner/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('파트너가 삭제되었습니다.');
      } else {
        throw new Error('파트너 삭제에 실패했습니다.');
      }

      router.push('/partner');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* <div className="text-gray-500">파트너를 찾을 수 없습니다.</div> */}
      </div>
    );
  }

  if (isLoggedOut) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => window.location.href = `/partner/${partner.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            삭제
          </button>
          <button
            onClick={() => window.location.href = `/partner`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="상세정보" {...tabProps(0)} />
            <Tab label="담당자" {...tabProps(1)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">회사이름</h3>
                <p className="mt-1 text-lg text-gray-900">
                {partner.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
                <p className="mt-1 text-lg text-gray-900">
                {partner.telnum}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">등급</h3>
                <p className="mt-1 text-lg text-gray-900">
                {partner.level}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p className="mt-1 text-lg text-gray-900">{format(partner.created, 'yyyy-MM-dd HH:mm:ss')}</p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        <table className="min-w-full divide-y divide-gray-200">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                성
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                전화번호
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/user/${user.id}`}>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.telnum}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  사용자 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </CustomTabPanel>
      </Box>
    </div>
  );
} 
