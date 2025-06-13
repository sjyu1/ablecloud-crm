'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype'
import MDEditor from '@uiw/react-md-editor';

interface Product {
  id: number;
  name: string;
  isoFilePath: string;
  checksum: string;
  version: string;
  contents: string;
  created: string;
  enabled: string;
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
  const [releaseHtml, setReleaseHtml] = useState('');

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    fetchProductDetail();
  }, []);

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

      //release note(Markdown → HTML 변환)
      fetchContents(result.data);

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

  const fetchContents = async (data: { contents: any; }) => {
    const processedContent = await remark()
    .use(remarkGfm)
    .use(() => {
      return (tree) => {
        visit(tree, 'paragraph', (node: any, index: number, parent: any) => {
          const firstChild = node.children?.[0];
          if (
            firstChild?.type === 'text' &&
            firstChild.value.startsWith('!!! note')
          ) {
            const text = firstChild.value.replace(/^!!! note\s*/, '');

            parent.children.splice(index, 1, {
              type: 'html',
              value: `<div class="note-block"><span class="note-icon">!</span><strong>NOTE:&nbsp;</strong> ${text}</div>`,
            });
          } else if (
            firstChild?.type === 'text' &&
            firstChild.value.startsWith('!!! info')
          ) {
            const text = firstChild.value.replace(/^!!! info\s*/, '');

            parent.children.splice(index, 1, {
              type: 'html',
              value: `<div class="info-block"><span class="info-icon">!</span><strong>INFO:&nbsp;</strong> ${text}</div>`,
            });
          } else if (
            firstChild?.type === 'text' &&
            firstChild.value.startsWith('!!! warning')
          ) {
            const text = firstChild.value.replace(/^!!! warning\s*/, '');

            parent.children.splice(index, 1, {
              type: 'html',
              value: `<div class="warn-block"><span class="warn-icon">!</span><strong>WARN:&nbsp;</strong> ${text}</div>`,
            });
          } else if (
            firstChild?.type === 'text' &&
            firstChild.value.startsWith('!!! danger')
          ) {
            const text = firstChild.value.replace(/^!!! danger\s*/, '');

            parent.children.splice(index, 1, {
              type: 'html',
              value: `<div class="danger-block"><span class="danger-icon">!</span><strong>DANGER:&nbsp;</strong> ${text}</div>`,
            });
          }
        });
      };
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(data.contents);


    const contentHtml = processedContent.toString();
    setReleaseHtml(contentHtml);
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

      router.push('/product');
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

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
            onClick={() => router.push(`/product/${product.id}/edit?page=${prevPage}`)}
            className={role === 'Admin' && product.enabled == '1' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDisabled}
            className={role === 'Admin' && product.enabled == '1' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            제품 비활성화
          </button>
          <button
            onClick={() => router.push(`/product/${product.id}/register_release?page=${prevPage}`)}
            className={role === 'Admin' && product.enabled == '1' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            릴리즈노트 등록 및 수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' && product.enabled == '1' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors' : 'hidden'}
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
            <Tab label="릴리즈노트" {...tabProps(1)} />
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
                  <a href={product.isoFilePath} download rel="noopener noreferrer">
                    [ 다운로드 ]
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품 Checksum(MD5S)</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product.checksum}
                </p>
              </div>
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500">제품 RPM경로</h3>
                <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                  <a href={product.rpmFilePath} target="_blank" rel="noopener noreferrer">
                    {product.rpmFilePath}
                  </a>
                </p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p className="mt-1 text-lg text-gray-900">{product.created}</p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
            {releaseHtml?.trim() ? (
              <MDEditor.Markdown
                style={{ padding: 10 }}
                source={releaseHtml}
                rehypePlugins={[rehypeRaw]}
              />
            ) : (
              <div className="text-gray-500 text-sm p-4">릴리즈노트가 없습니다.</div>
            )}
            </div>
          </div>
        </div>
        </CustomTabPanel>
      </Box>
    </div>
  );
}