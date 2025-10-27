import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import BusinessEditForm from './businessEditForm';
import log from '@/utils/logger';

interface BusinessEditPageProps {
  params: { id: string };
  searchParams?: { page?: string; searchField?: string; searchValue?: string };
}

async function fetchBusinessDetail(id: string) {
  const apiUrl = new URL(`${process.env.API_URL}/business/${id}`);

  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '사업 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

async function fetchManagers() {
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  const apiUrl = new URL(`${process.env.API_URL}/user/forCreateManager`);
  apiUrl.searchParams.set('order', 'name'); // 이름순 정렬
  if (role === 'User') {  // 파트너일 경우
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '담당자 정보를 가져오는 데 실패했습니다.');
  }
  return data.data;
}

async function fetchProducts() {
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  const apiUrl = new URL(`${process.env.API_URL}/product`);

  if (role === 'User') {  // 파트너일 경우
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }

  const res = await fetchWithAuth(apiUrl.toString(), {cache: 'no-store',});
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '제품 정보를 가져오는 데 실패했습니다.');
  }

  return data.data;
}

export default async function BusinessEditPage({ params, searchParams: searchParamsPromise }: BusinessEditPageProps) {
  log.info('API URL ::: PUT /business/'+params.id);
  const searchParams = await searchParamsPromise;
  const prevPage = searchParams?.page ?? '1';
  const prevSearchField = searchParams?.searchField ?? 'name';
  const prevSearchValue = searchParams?.searchValue ?? '';

  // const [business, managers, products] = await Promise.all([
  //   fetchBusinessDetail(params.id),
  //   fetchManagers(),
  //   fetchProducts(),
  // ]);

  let business = null;
  let managers: any[] = [];
  let products: any[] = [];
  let errorMessage: string | null = null;

  // business 조회
  try {
    business = await fetchBusinessDetail(params.id);
    managers = await fetchManagers();
    products = await fetchProducts();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '사업 정보를 가져오는 데 실패했습니다.';
    log.info('PUT /business/'+params.id+' ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사업 수정</h1>
      </div>

      {errorMessage || !business ? (
        <div className="text-red-600">
          {errorMessage || '사업 정보를 불러올 수 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <BusinessEditForm
            business={business}
            managers={managers}
            products={products}
            prevPage={prevPage}
            prevSearchField={prevSearchField}
            prevSearchValue={prevSearchValue}
          />
        </div>
      )}
    </div>
  );
}
