import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import ProductEditClient from './productEditClient';
import log from '@/utils/logger';

interface ProductEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; searchValue?: string; enablelist?: string };
}

interface ProductForm {
  id: number;
  name: string;
  version: string;
  level?: string;
  isoFilePath: string;
  checksum: string;
  category_id: number;
}

interface ProductCategory {
  id: number;
  name: string;
}

async function fetchProductDetail(id: string): Promise<ProductForm> {
  const apiUrl = new URL(`${process.env.API_URL}/product/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '제품 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

async function fetchProductCategory(): Promise<ProductCategory[]> {
  const apiUrl = new URL(`${process.env.API_URL}/product/category`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '제품 카테고리 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function ProductEditPage({ params, searchParams: searchParamsPromise }: ProductEditPageProps) {
  log.info('API URL ::: PUT /product/'+params.id);
  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevSearchValue = searchParams?.searchValue ?? '';
  const prevEnableList = searchParams?.enablelist ?? '';

  // const [product, productCategory] = await Promise.all([
  //   fetchProductDetail(id),
  //   fetchProductCategory(),
  // ]);

  // product 조회
  let product: ProductForm | null = null;
  let productCategory: ProductCategory[] = [];
  let errorMessage: string | null = null;

  try {
    product = await fetchProductDetail(params.id);
    productCategory = await fetchProductCategory();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '제품 정보를 찾을 수 없습니다.';
    log.info('PUT /product/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage == 'Failed to fetch user information') {
      return redirect('/api/logout'); // 토큰 만료시 로그아웃
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 수정</h1>
      </div>

      {errorMessage || !product ? (
        <div className="text-red-600">
          {errorMessage || '제품 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ProductEditClient
            product={product}
            productCategory={productCategory}
            prevPage={prevPage}
            prevSearchValue={prevSearchValue}
            enablelist={prevEnableList}
          />
        </div>
      )}
    </div>
  );
}
