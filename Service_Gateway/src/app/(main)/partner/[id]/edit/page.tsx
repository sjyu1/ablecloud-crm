import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import PartnerEditForm from './partnerEditForm';
import log from '@/utils/logger';

interface PartnerForm {
  id: number;
  name: string;
  telnum: string;
  level: string;
  created: string;
  product_category: string[];
}

interface ProductCategory {
  id: number;
  name: string;
}

interface PartnerEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; level?: string; searchValue?: string };
}

async function fetchPartnerDetail(id: string): Promise<PartnerForm> {
  const apiUrl = new URL(`${process.env.API_URL}/partner/${id}`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '파트너 정보를 가져오는 데 실패했습니다.');
  }

  const productCategoryArray = Array.isArray(data.data.product_category)
    ? data.data.product_category
    : (data.data.product_category || '').split(',').map((id: string) => id.trim());

  return {
    ...data.data,
    product_category: productCategoryArray,
  };
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

export default async function PartnerEditPage({ params, searchParams: searchParamsPromise }: PartnerEditPageProps) {
  log.info('API URL ::: PUT /partner/'+params.id);
  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevLevel = searchParams?.level ?? 'PLATINUM';
  const prevSearchValue = searchParams?.searchValue ?? '';

  let partner: PartnerForm | null = null;
  let productCategories: ProductCategory[] = [];
  let errorMessage: string | null = null;

  try {
    partner = await fetchPartnerDetail(params.id);
    productCategories = await fetchProductCategory();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '파트너 정보를 불러올 수 없습니다.';
    log.info('PUT /partner/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">파트너 수정</h1>
      </div>

      {errorMessage || !partner ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <PartnerEditForm
            partner={partner}
            productCategories={productCategories}
            searchParams={{ page: prevPage, level: prevLevel, searchValue: prevSearchValue }}
          />
        </div>
      )}
    </div>
  );
}
