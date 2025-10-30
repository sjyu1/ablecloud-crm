'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface Business {
  id: number;
  name: string;
  status: string;
  issued: string;
  expired: string;
  customer_name: string;
  node_cnt: number;
  core_cnt: number;
  license_key: string;
  license_status: string;
  license_issued: string;
  license_expired: string;
  license_trial: string;
  manager_id: string;
  manager_name: string;
  manager_company: string;
  product_name: string;
  product_version: string;
  details: string;
  deposit_use: string;
}

interface Props {
  business: Business | null;
  role?: string;
  errorMessage: string;
  prevPage: string;
  prevSearchField: string;
  prevSearchValue: string;
  initialTab: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
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

export default function BusinessDetailClient({
  business,
  role,
  errorMessage,
  prevPage,
  prevSearchField,
  prevSearchValue,
  initialTab,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState<number>(initialTab);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 사업을 삭제하시겠습니까?')) return;

    if (business?.license_key) {
      alert('사업에 대한 라이선스가 존재합니다. 라이선스를 삭제하세요.');
      return;
    }

    if (business?.deposit_use === '1') {
      if (
        !confirm(
          '사업에 대한 크레딧 사용이 존재합니다. 사업 삭제 시 사용된 크레딧도 삭제됩니다. 정말 삭제하시겠습니까?'
        )
      ) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/business/${business?.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errRes = await response.json();
        throw new Error(errRes.message || '사업 삭제에 실패했습니다.');
      }
      alert('사업이 삭제되었습니다.');
      router.push(
        `/business?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() =>
              router.push(
                `/business/${business?.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            삭제
          </button>
          <button
            onClick={() =>
              router.push(`/business?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      {/* 에러메지 */}
      {errorMessage && (
        <div className="text-red-600">
          {errorMessage}
        </div>
      )}

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="상세정보" {...tabProps(0)} />
            <Tab label="라이선스 정보" {...tabProps(1)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          {/* 상세정보 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">사업</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">사업 담당자</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.manager_name} ({business?.manager_company})
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">고객회사</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.customer_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">제품</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.product_name} (v{business?.product_version})
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">노드수</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.node_cnt}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">코어수</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.core_cnt} {business?.deposit_use == '1' && (' (크레딧 사용)')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">사업 상태</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.status === 'standby' ? ('대기 중') : business?.status === 'meeting' ? ('고객 미팅') : business?.status === 'poc' ? ('PoC') :business?.status === 'bmt' ? ('BMT') :business?.status === 'ordering' ? ('발주') :business?.status === 'proposal' ? ('제안') :business?.status === 'ordersuccess' ? ('수주 성공') :business?.status === 'cancel' ? ('취소') : ('Unknown Type')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">사업 시작일</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.issued}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">사업 종료일</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business?.expired}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">세부사항</h3>
                  <textarea
                    id="text-input"
                    name="details"
                    value={business?.details ?? ''}
                    rows={5}
                    readOnly
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {/* <p className="mt-1 text-lg text-gray-900">
                    {business.details}
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={1}>
          {/* 라이선스 */}
          {business?.license_key ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">라이선스 키</h3>
                  <p className="mt-1 text-lg text-gray-900">{business.license_key}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">상태</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        business.license_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                    {/* <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"> */}
                      {business.license_status === 'active' ? '활성' : '비활성'}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Trial</h3>
                  <p className="mt-1 text-lg text-gray-900">{business.license_trial == '1' ? 'O' : '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">시작일</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business.license_issued}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">만료일</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {business.license_expired}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 space-y-6">
                <h3 className="text-sm font-medium text-gray-500">라이선스 정보가 없습니다.</h3>
              </div>
            </div>
          )}
        </CustomTabPanel>
      </Box>
    </div>
  );
}
