'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Support {
  id: number;
  customer_id: string;
  customer: string;
  business_id: string;
  business: string;
  issued: string;
  type: string;
  issue: string;
  solution: string;
  actioned: string;
  action_type: string;
  manager: string;
  status: string;
  requester: string;
  requester_telnum: string;
  requester_email: string;
  note: string;
  writer: string;
}

interface SupportDetailClientProps {
  support: Support | null;
  role?: string;
  prevPage: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function SupportDetailClient({
  support,
  role,
  prevPage,
  prevSearchField,
  prevSearchValue,
}: SupportDetailClientProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('정말 이 기술지원을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/support/${support?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('기술지원이 삭제되었습니다.');
        router.push(`/support?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
      } else {
        const data = await response.json();
        alert(data.message || '기술지원 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">기술지원 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={() =>
              router.push(
                `/support/${support?.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600' : 'hidden'}
          >
            삭제
          </button>
          <button
            onClick={() =>
              router.push(
                `/support?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
              )
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            목록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">고객회사</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.customer}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">사업</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.business}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청일자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.issued}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">구분</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.type === 'consult' ? ('기술상담') : support?.type === 'technical' ? ('기술지원') : support?.type === 'incident' ? ('장애지원') : support?.type === 'poc' ? ('PoC') : support?.type === 'other' ? ('기타') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청내역</h3>
              <p className="mt-1 text-lg text-gray-900 whitespace-pre-line">
                {support?.issue}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">처리내역</h3>
              <p className="mt-1 text-lg text-gray-900 whitespace-pre-line">
                {support?.solution}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">조치일자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.actioned}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">조치방식</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.action_type === 'phone' ? ('유선지원') : support?.action_type === 'remote' ? ('원격지원') : support?.action_type === 'mail' ? ('메일지원') : support?.action_type === 'site' ? ('현장지원') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">담당자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.manager}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">완료여부</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.status === 'processing' ? ('처리중') : support?.status === 'complete' ? ('완료') : ('Unknown Type')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.requester}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청자 전화번호</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.requester_telnum}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">요청자 이메일</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.requester_email}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">비고</h3>
              <textarea
                id="text-input"
                name="note"
                value={support?.note ?? ''}
                rows={5}
                readOnly
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {/* <p className="mt-1 text-lg text-gray-900">
                {support?.details}
              </p> */}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">작성자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {support?.writer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
