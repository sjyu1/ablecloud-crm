'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { fetchWithAuth } from '@/utils/api';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import rehypeRaw from 'rehype-raw';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype';

interface File {
  name: string;
  date: string;
  size: string;
  path?: string;
}

interface Product {
  id: number;
  name: string;
  isoFilePath: string;
  checksum: string;
  version: string;
  created: string;
  enabled: string;
  category_name: string;
  // contents: string;
}

interface Props {
  product: Product | null;
  role?: string;
  // releaseHtml: string;
  productId: string;
  prevPage: string;
  prevSearchValue: string;
  enablelist: string;
}

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
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

export default function ProductDetailClient({ product, role, productId, prevPage, prevSearchValue, enablelist }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(0);
  const [releaseHtml, setReleaseHtml] = useState<string>('');
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [files, setAddOnFiles] = useState<File[]>([]);
  const [isAddOnLoading, setIsAddOnLoading] = useState(false);
  const [addonError, setAddOnError] = useState<string | null>(null);
  const [templates, setTemplateFiles] = useState<File[]>([]);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    if (value === 1 && !isReleaseLoading && product?.id) {
      fetchReleaseDetail(product.id);
      // productMarkdown(product.contents);
    }
    if (value === 2 && !isAddOnLoading && files.length === 0) {
      fetchAddOn();
    }
    if (value === 3 && !isTemplateLoading && templates.length === 0) {
      fetchTemplate();
    }

  }, [value]);

  async function fetchReleaseDetail(id: number) {
    setIsReleaseLoading(true);
    setReleaseError(null);
    try {
      const res = await fetch(`/api/product/${id}/release`, {
        method: 'GET',
      });
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.message || '제품 릴리즈 정보를 가져오는 데 실패했습니다.');
      }

      productMarkdown(data.data.data.contents)

    } catch (err: any) {
      setReleaseError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsReleaseLoading(false);
    }
  }

  const productMarkdown = async (contents: string) => {
    setIsReleaseLoading(true);
    setReleaseError(null);
    try {
      // 릴리즈노트 markdown 형식으로 변환
      const file = await remark()
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
        .process(contents);
  
      setReleaseHtml(file.toString());
  
    } catch (e: any) {
      setReleaseError(e.message);
    } finally {
      setIsReleaseLoading(false);
    }
  };
  

  const fetchAddOn = async () => {
    setIsAddOnLoading(true);
    setAddOnError(null);
    try {
      const res = await fetch(`/api/product/${productId}/addon`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();

      setAddOnFiles(data);
    } catch (e: any) {
      setAddOnError(e.message);
    } finally {
      setIsAddOnLoading(false);
    }
  };

  const fetchTemplate = async () => {
    setIsTemplateLoading(true);
    setTemplateError(null);
    try {
      const res = await fetch(`/api/product/${productId}/template`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();

      setTemplateFiles(data);
    } catch (e: any) {
      setTemplateError(e.message);
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleDisabled = async () => {
    if (!confirm('정말 이 제품을 비활성화 하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/product/${productId}/disabled`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('제품이 비활성화 되었습니다.');
        router.push(`/product?enablelist=${enablelist}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '제품 비활성화에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleEnabled = async () => {
    if (!confirm('정말 이 제품을 활성화 하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/product/${productId}/enabled`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('제품이 활성화 되었습니다.');
        router.push(`/product?enablelist=${enablelist}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '제품 활성화에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 제품을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/product/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('제품이 삭제되었습니다.');
        router.push(`/product?enablelist=${enablelist}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || '제품 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 상세정보</h1>
        <div className="space-x-2">
        <button
            onClick={() => router.push(`/product/${product?.id}/edit?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${enablelist}`)}
            className={role === 'Admin' && product?.enabled == '1' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDisabled}
            className={role === 'Admin' && product?.enabled == '1' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            제품 비활성화
          </button>
          <button
            onClick={handleEnabled}
            className={role === 'Admin' && product?.enabled == '0' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            제품 활성화
          </button>
          <button
            onClick={() => router.push(`/product/${product?.id}/register_release?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${enablelist}`)}
            className={role === 'Admin' && product?.enabled == '1' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            릴리즈노트 등록 및 수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors' : 'hidden'}
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/product?page=${prevPage}&searchValue=${prevSearchValue}&enablelist=${enablelist}`)}
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
            <Tab label="AddOn" {...tabProps(2)} />
            <Tab label="Template" {...tabProps(3)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product?.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품 카테고리</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product?.category_name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품버전</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product?.version}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">활성화 여부</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product?.enabled == "1" ? '활성화' : '비활성화'}
                </p>
              </div>
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500">제품 ISO경로</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {product?.isoFilePath}
                </p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품 다운로드</h3>
                <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                  {/* <a href={product?.isoFilePath} download rel="noopener noreferrer">
                    [ 다운로드 ]
                  </a> */}
                  <a href={`/api/product/${product?.id}/download?filePath=iso/${product?.isoFilePath}`} download rel="noopener noreferrer">
                    [ 다운로드 ]
                  </a>
                  {/* <button onClick={handleDownload} className="text-blue-500 hover:underline">
                    [ 다운로드 ]
                  </button> */}
                  {/* {isDownloading && <span>&nbsp;&nbsp;&nbsp;다운로드 중...</span>} */}
                  {/* {isDownloading && (
                    <span className="ml-4 text-sm text-gray-500">
                      다운로드 중... (남은 시간: {estimatedTimeLeft})
                    </span>
                  )} */}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">제품 Checksum(MD5S)</h3>
                <p className="mt-1 text-lg text-gray-900">
                {product?.checksum}
                </p>
              </div>
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500">제품 RPM경로</h3>
                <p className="mt-1 text-lg text-gray-900 hover:text-gray-500 transition-colors">
                  <a href={product?.rpmFilePath} target="_blank" rel="noopener noreferrer">
                    {product?.rpmFilePath}
                  </a>
                </p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {product?.created}
                </p>
              </div>
            </div>
          </div>
        </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        {isReleaseLoading ? (
          <div className="flex justify-center items-center py-10 text-gray-500 text-sm">
            로딩 중...
          </div>
        ) : releaseError ? (
          <div className="flex justify-center items-center py-10 text-red-500 text-sm">
            {releaseError}
          </div>
        ) : (
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
        )}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
        {isAddOnLoading ? (
          <div className="flex justify-center items-center py-10 text-gray-500 text-sm">
            로딩 중...
          </div>
        ) : addonError ? (
          <div className="flex justify-center items-center py-10 text-red-500 text-sm">
            {addonError}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 border-b border-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사이즈</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.name} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 break-all">
                    <a href={`/api/product/${product?.id}/download?filePath=addon/${file.name}`} download rel="noopener noreferrer"
                      className="text-gray-900 hover:text-gray-500 transition-colors hover:underline">
                      {file.name}
                    </a>
                    {/* <a
                      href={`/api/product/${params.id}/download?filePath=addon/${file.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm font-medium"
                    >
                      {file.name}
                    </a> */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.size}</td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500 text-sm">
                    파일 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
        {isTemplateLoading ? (
          <div className="flex justify-center items-center py-10 text-gray-500 text-sm">
            로딩 중...
          </div>
        ) : templateError ? (
          <div className="flex justify-center items-center py-10 text-red-500 text-sm">
            {templateError}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 border-b border-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사이즈</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((file) => (
                <tr key={file.name} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 break-all">
                    <a href={`/api/product/${product?.id}/download?filePath=template/${file.name}`} download rel="noopener noreferrer"
                      className="text-gray-900 hover:text-gray-500 transition-colors hover:underline">
                      {file.name}
                    </a>
                    {/* <a
                      href={file.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm font-medium"
                    >
                      {file.name}
                    </a> */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.size}</td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500 text-sm">
                    파일 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        </CustomTabPanel>
      </Box>
    </div>
  );
}