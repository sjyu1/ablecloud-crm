import { fetchWithAuth } from '@/utils/api';
import CreditRegisterClient from './creditRegisterClient';
import log from '@/utils/logger';

interface Partner {
  id: number;
  name: string;
}

async function fetchPartnerList(): Promise<Partner[]> {
  const apiUrl = new URL(`${process.env.API_URL}/partner?page=1&limit=10000&order=name`);
  const res = await fetchWithAuth(apiUrl.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '파트너 정보를 불러올 수 없습니다.');
  }

  return data.data;
}

export default async function CreditRegisterPage() {
  log.info('API URL ::: GET /partner');

  let partners: Partner[] = [];
  let errorMessage: string | null = null;

  try {
    partners = await fetchPartnerList();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
    log.error('GET /partner ERROR ::: ' + errorMessage);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">크레딧 등록</h1>
      </div>

      {errorMessage ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <CreditRegisterClient partners={partners} />
      )}
    </div>
  );
}
