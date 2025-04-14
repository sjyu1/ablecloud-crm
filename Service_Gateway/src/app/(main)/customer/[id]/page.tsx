'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);

  const [users, setUsers] = useState<User[]>([])
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchCustomerDetail();
    fetchCustomerUserDetail();
  }, []);

  const fetchCustomerDetail = async () => {
    try {
      const response = await fetch(`/api/customer/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '고객 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setCustomer(result.data);
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

  const fetchCustomerUserDetail = async () => {
    try {
      const response = await fetch(`/api/user/forManager?type=customer&company_id=${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '파트너 담당자 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setUsers(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      if (err instanceof Error) {
        if (err.message == 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 고객을 삭제하시겠습니까?')) {
      return;
    }

    if (users.length > 0) {
      alert('고객 담당자가 존재합니다. 고객 담당자를 삭제하세요.');
      return;
    }

    try {
      const response = await fetch(`/api/customer/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('고객이 삭제되었습니다.');
      } else {
        throw new Error('고객 삭제에 실패했습니다.');
      }

      router.push('/customer');
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

  if (!customer) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* <div className="text-gray-500">고객을 찾을 수 없습니다.</div> */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">고객 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => window.location.href = `/customer/${customer.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            // style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            // style={{ display: role === 'Admin' ? '' : 'none' }}
          >
            삭제
          </button>
          <button
            onClick={() => window.location.href = `/customer`}
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
            <Tab label="사업정보" {...tabProps(2)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">회사이름</h3>
                <p className="mt-1 text-lg text-gray-900">
                {customer.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
                <p className="mt-1 text-lg text-gray-900">
                {customer.telnum}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">고객 관리 파트너 (회사)</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {customer.manager_name} ({customer.manager_company})
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p className="mt-1 text-lg text-gray-900">{format(customer.created, 'yyyy-MM-dd HH:mm:ss')}</p>
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
        <CustomTabPanel value={value} index={2}>
        {customer.business_name ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업명</h3>
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
                  {format(customer.business_issued, 'yyyy-MM-dd')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">사업 만료일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {format(customer.business_expired, 'yyyy-MM-dd')}
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
