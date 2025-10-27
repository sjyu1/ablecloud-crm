import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import PartnerRegisterForm from './partnerRegisterForm';
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

export default async function PartnerRegisterPage() {
  log.info('API URL ::: POST /partner');
  // 제품 카테고리 조회
  // const productCategories = await fetchProductCategories();

  let productCategories: ProductCategory[] = [];
  let errorMessage: string | null = null;

  try {
    productCategories = await fetchProductCategories();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '제품 카테고리 정보를 불러오는 데 실패했습니다.';
    log.info('POST /partner ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">파트너 등록</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {errorMessage ? (
          <div className="text-red-600">
            {errorMessage}
          </div>
        ) : (
          <PartnerRegisterForm categories={productCategories} />
        )}
      </div>
    </div>
  );
}
