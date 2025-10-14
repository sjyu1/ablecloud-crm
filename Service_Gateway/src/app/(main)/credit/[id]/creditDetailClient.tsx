'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useState } from 'react';

interface Credit {
  id: string;
  partner_id: string;
  partner: string;
  business_id: string;
  business: string;
  deposit: string;
  credit: string;
  note: string;
  created: string;
  deposit_use: string;
}

interface Props {
  credit: Credit | null;
  role?: string;
  errorMessage?: string | null;
  prevPage: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function CreditDetailClient({
  credit,
  role,
  errorMessage,
  prevPage,
  prevSearchField,
  prevSearchValue,
}: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!credit) return;
    if (!confirm('정말 이 크레딧을 삭제하시겠습니까?')) return;

    if (credit.deposit_use === '1') {
      if (!confirm('해당 크레딧이 사용되었습니다. 그래도 삭제하시겠습니까?')) return;
    }

    if (credit.business) {
      alert('크레딧에 연결된 사업이 존재합니다. 사업을 먼저 삭제하세요.');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/credit/${credit.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('크레딧 삭제에 실패했습니다.');
      alert('크레딧이 삭제되었습니다.');
      router.push(`/credit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        {errorMessage}
      </div>
    );
  }

  if (!credit) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        크레딧 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">크레딧 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() =>
              router.push(
                `/credit/${credit.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className={
              role === 'Admin'
                ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
                : 'hidden'
            }
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={
              role === 'Admin'
                ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors'
                : 'hidden'
            }
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
          <button
            onClick={() =>
              router.push(
                `/credit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">파트너</h3>
              <p className="mt-1 text-lg text-gray-900">
                <a href={`/partner/${credit.partner_id}`} className="text-blue-600 hover:underline">
                  {credit.partner}
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">사업</h3>
              <p className="mt-1 text-lg text-gray-900">
                {credit.business ? (
                  <a href={`/business/${credit.business_id}`} className="text-blue-600 hover:underline">
                    {credit.business}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">구매 크레딧</h3>
              <p className="mt-1 text-lg text-gray-900">{credit.deposit || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">사용 크레딧</h3>
              <p className="mt-1 text-lg text-gray-900">{credit.credit || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">비고</h3>
              <textarea
                readOnly
                value={credit.note ?? ''}
                rows={5}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">생성일</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(new Date(credit.created), 'yyyy-MM-dd HH:mm:ss')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
