'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface Product {
  id: number;
  name: string;
  isoFilePath: string;
  version: string;
  cube_version: string;
  mold_version: string;
  glue_version: string;
  iso_builddate: string;
  cube_builddate: string;
  glue_builddate: string;
  mold_builddate: string;
  add_function: string;
  patch_function: string;
  issue_function: string;
  created: string;
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [value, setValue] = useState(0);
  const addRef = useRef<HTMLTextAreaElement>(null);
  const patchRef = useRef<HTMLTextAreaElement>(null);
  const issueRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchProductDetail();
  }, []);

  // textarea 값 높이 자동조절
  useEffect(() => {
    const resize = (el: HTMLTextAreaElement | null) => {
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    };
  
    if (value === 2) {
      resize(addRef.current);
      resize(patchRef.current);
      resize(issueRef.current);
    }
  }, [value]);

  const fetchProductDetail = async () => {
    try {
      const response = await fetch(`/api/product/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '제품 정보를 불러올 수 없습니다.');
      }

      if (result.data.error) {
        throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
      }

      setProduct(result.data);
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

  const handleDisabled = async () => {
    if (!confirm('정말 이 제품을 비활성화 하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/product/${params.id}/disabled`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('제품이 비활성화 되었습니다.');
      } else {
        throw new Error('제품 비활성화에 실패했습니다.');
      }

      router.push(`/product/${params.id}?page=${prevPage}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };
  const handleDelete = async () => {
    if (!confirm('정말 이 제품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/product/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('제품이 삭제되었습니다.');
      } else {
        throw new Error('제품 삭제에 실패했습니다.');
      }

      router.push('/product');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="text-red-500">{error}</div>
  //     </div>
  //   );
  // }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
        <div className="text-gray-500">제품을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={handleDisabled}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            제품 비활성화
          </button>
          <button
            onClick={() => router.push(`/product/${product.id}/edit?page=${prevPage}`)}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors' : 'hidden'}
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/product?page=${prevPage}`)}
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
            <Tab label="버전정보" {...tabProps(1)} />
            <Tab label="릴리즈노트" {...tabProps(2)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품명</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품버전</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.version}
                </p>
              </div>
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500">제품 ISO경로</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {product.isoFilePath}
                </p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품 다운로드</h3>
                <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                  <a href={"/iso"+product.isoFilePath} target="_self" rel="noopener noreferrer">
                    [ 다운로드 ]
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p className="mt-1 text-lg text-gray-900">{format(product.created, 'yyyy-MM-dd HH:mm:ss')}</p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ISO</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.version} [Build Date : {product.iso_builddate}]
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cube</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.cube_version} [Build Date : {product.cube_builddate}]
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Glue</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.glue_version} [Build Date : {product.glue_builddate}]
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mold</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.mold_version} [Build Date : {product.mold_builddate}]
                </p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">추가 기능</h3>
                <p className="mt-1 text-lg text-gray-900">
                <textarea
                  ref={addRef}
                  value={product.add_function ?? ''}
                  readOnly
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden"
                />
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">패치 기능</h3>
                <p className="mt-1 text-lg text-gray-900">
                <textarea
                  ref={patchRef}
                  value={product.patch_function ?? ''}
                  readOnly
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden"
                />
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">알려진 이슈</h3>
                <p className="mt-1 text-lg text-gray-900">
                <textarea
                  ref={issueRef}
                  value={product.issue_function ?? ''}
                  readOnly
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden"
                />
                </p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
      </Box>
      
    </div>
  );
}