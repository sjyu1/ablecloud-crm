import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import ProductDetailClient from './productDetailClient';
import log from '@/utils/logger';

interface Product {
  id: number;
  name: string;
  isoFilePath: string;
  checksum: string;
  version: string;
  // contents: string;
  created: string;
  enabled: string;
  category_name: string;
}

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchProduct(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/product/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '제품 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

// async function parseMarkdown(contents: string) {
//   const file = await remark()
//     .use(remarkGfm)
//     .use(() => {
//       return (tree) => {
//         visit(tree, 'paragraph', (node: any, index: number, parent: any) => {
//           const firstChild = node.children?.[0];
//           if (
//             firstChild?.type === 'text' &&
//             firstChild.value.startsWith('!!! note')
//           ) {
//             const text = firstChild.value.replace(/^!!! note\s*/, '');

//             parent.children.splice(index, 1, {
//               type: 'html',
//               value: `<div class="note-block"><span class="note-icon">!</span><strong>NOTE:&nbsp;</strong> ${text}</div>`,
//             });
//           } else if (
//             firstChild?.type === 'text' &&
//             firstChild.value.startsWith('!!! info')
//           ) {
//             const text = firstChild.value.replace(/^!!! info\s*/, '');

//             parent.children.splice(index, 1, {
//               type: 'html',
//               value: `<div class="info-block"><span class="info-icon">!</span><strong>INFO:&nbsp;</strong> ${text}</div>`,
//             });
//           } else if (
//             firstChild?.type === 'text' &&
//             firstChild.value.startsWith('!!! warning')
//           ) {
//             const text = firstChild.value.replace(/^!!! warning\s*/, '');

//             parent.children.splice(index, 1, {
//               type: 'html',
//               value: `<div class="warn-block"><span class="warn-icon">!</span><strong>WARN:&nbsp;</strong> ${text}</div>`,
//             });
//           } else if (
//             firstChild?.type === 'text' &&
//             firstChild.value.startsWith('!!! danger')
//           ) {
//             const text = firstChild.value.replace(/^!!! danger\s*/, '');

//             parent.children.splice(index, 1, {
//               type: 'html',
//               value: `<div class="danger-block"><span class="danger-icon">!</span><strong>DANGER:&nbsp;</strong> ${text}</div>`,
//             });
//           }
//         });
//       };
//     })
//     .use(remarkRehype, { allowDangerousHtml: true })
//     .use(rehypeRaw)
//     .use(rehypeStringify)
//     .process(contents);

//   return file.toString();
// }

export default async function ProductDetailPage({ params, searchParams: searchParamsPromise }: PageProps) {
  log.info('API URL ::: GET /product/'+params.id);
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  // product 조회
  // const product = await fetchProduct(params.id);

  // if (!product) {
  //   return <div className="p-8 text-center text-gray-500">제품 정보를 불러올 수 없습니다.</div>;
  // }

  let product: Product | null = null;
  let errorMessage: string | null = null;

  try {
    product = await fetchProduct(params.id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '제품 정보를 불러오는 데 실패했습니다.';
    log.info('GET /product/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  // 릴리즈노트 markdown 형식으로 변환
  // const releaseHtml = await parseMarkdown(product.contents || '');

  // 검색 파라미터 (page, searchField, searchValue 등)
  const prevPage = Array.isArray(searchParams.page) ? searchParams.page[0] : (searchParams.page ?? '1');
  const prevSearchValue = Array.isArray(searchParams.searchValue)
    ? searchParams.searchValue[0]
    : (searchParams.searchValue ?? '');
  const prevEnableList = Array.isArray(searchParams.enablelist)
    ? searchParams.enablelist[0]
    : (searchParams.enablelist ?? '');
  

  if (errorMessage) {
    return (
      <div className="text-red-600">
        {errorMessage}
      </div>
    );
  }
  return (
    <ProductDetailClient
      product={product}
      role={role}
      // releaseHtml={releaseHtml}
      productId={params.id}
      prevPage={prevPage}
      prevSearchValue={prevSearchValue}
      enablelist={prevEnableList}
    />
  );
}
