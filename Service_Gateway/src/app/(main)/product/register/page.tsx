import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import ProductRegisterForm from './productRegisterForm';
import log from '@/utils/logger';

interface ProductCategory {
  id: number;
  name: string;
}

async function fetchProductCategories(): Promise<ProductCategory[]> {
  const apiUrl = new URL(`${process.env.API_URL}/product/category`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '제품 카테고리 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function ProductRegisterPage() {
  log.info('API URL ::: POST /product');
  // category 조회
  // const productCategories = await fetchProductCategories();

  let productCategories: ProductCategory[] = [];
  let errorMessage: string | null = null;

  try {
    productCategories = await fetchProductCategories();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '제품 카테고리 정보를 불러오는 데 실패했습니다.';
    log.info('POST /product ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">제품 등록</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {errorMessage ? (
          <div className="text-red-600">
            {errorMessage}
          </div>
        ) : (
          <ProductRegisterForm categories={productCategories} />
        )}
      </div>
    </div>
  );
}
