import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import ProductListClient from './productListClient';
import Link from 'next/link';
import log from '@/utils/logger';

interface Product {
  id: number;
  name: string;
  version: string;
  enabled: string;
  created: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface ProductPageProps {
  searchParams: {
    page?: string;
    searchField?: string;
    searchValue?: string;
    enablelist?: string;
  };
}

async function fetchProductList(
  page: number,
  searchField: string,
  searchValue: string,
  role?: string,
  companyId?: string,
  enablelist?: string
): Promise<{ products: Product[]; pagination: Pagination }> {
  const apiUrl = new URL(`${process.env.API_URL}/product`);
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '10');
  apiUrl.searchParams.set('enablelist', enablelist ?? '');

  if (searchValue.trim()) {
    apiUrl.searchParams.set(searchField, searchValue.trim());
  }

  if (role === 'User') {
    apiUrl.searchParams.set('company_id', companyId ?? '');
  }
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '제품 정보를 가져오는 데 실패했습니다.');
  }

  return {
    products: data.data,
    pagination: {
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      itemsPerPage: data.pagination.itemsPerPage,
    },
  };
}

export default async function ProductPage({ searchParams: searchParamsPromise }: ProductPageProps) {
  log.info('API URL ::: GET /product');
  const searchParams = await searchParamsPromise;
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const companyId = (await cookieStore).get('companyId')?.value;

  const page = Number(searchParams.page || '1');
  const searchField = searchParams.searchField || 'name';
  const searchValue = searchParams.searchValue || '';
  const enablelist = searchParams.enablelist || '';

  let products: Product[] = [];
  let pagination: Pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  let errorMessage: string | null = null;

  try {
    const result = await fetchProductList(page, searchField, searchValue, role, companyId, enablelist);
    products = result.products;
    pagination = result.pagination;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '제품 목록을 불러오는 데 실패했습니다.';
    log.info('GET /product ERROR ::: '+errorMessage);
    if (errorMessage === 'Failed to fetch user information') {
      return redirect('/api/logout');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 관리</h1>
        <Link
          href="/product/register"
          className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
        >
          제품 등록
        </Link>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <ProductListClient
          products={products}
          pagination={pagination}
          searchField={searchField}
          searchValue={searchValue}
          role={role}
          enablelist={enablelist}
        />
      )}
    </div>
  );
}
