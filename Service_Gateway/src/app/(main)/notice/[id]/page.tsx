'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import { format } from 'date-fns';

interface Notice {
  id: number;
  title: string;
  content: string;
  writer: string;
  level: string;
  created: string;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  email: string;
  company: string;
  type: string;
  level: string;
}

export default function noticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const prevPage = searchParams.get('page') || '1';
  const prevSearchField = searchParams.get('searchField') || 'title';
  const prevSearchValue = searchParams.get('searchValue') || '';
  const [role, setRole] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchnoticeDetail = async () => {
      try {
        const response = await fetch(`/api/notice/${params.id}`, { signal });
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.message || '공지사항 정보를 불러올 수 없습니다.');
        }
  
        if (result.data.error) {
          throw new Error(result.data.error instanceof Error ? result.data.message : result.data.message || '오류가 발생했습니다.');
        }
  
        setNotice(result.data);
      } catch (err) {
        if ((err as any).name === 'AbortError') return;
        // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        if (err instanceof Error) {
          if (err.message == 'Failed to fetch user information') {
            logoutIfTokenExpired(); // 토큰 만료시 로그아웃
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchnoticeDetail();

    return () => controller.abort();
  }, []);

  const fetchUsers = async () => {
    try {
      const page = Number(searchParams.get('page')) || 1;

      let url = `/api/user?page=${page}&limit=10000&level=${notice?.level}&order=name`;

      if (role === 'User') {
        url += `&role=User`;
      }

      const response = await fetch(url,{});
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '오류가 발생했습니다.');
      }

      setUsers(result.data);
      setSelectedUsers(result.data.map((user: User) => user.id)); //체크박스 초기 체크상태
      setSelectAll(true); //전체 체크박스 초기 체크상태
    } catch (err) {
      if (err instanceof Error) {
        if (err.message == 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        }
      } else {
        alert('사용자 목록 조회에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notice/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('공지사항이 삭제되었습니다.');
      } else {
        throw new Error('공지사항 삭제에 실패했습니다.');
      }

      router.push(`/notice?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleSendMail = async () => {
    await fetchUsers();
    setShowUserModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-sm">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">공지사항을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 상세정보</h1>
        <div className="space-x-2">
          <button
            onClick={handleSendMail}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            파트너에게 메일 보내기
          </button>
          <button
            onClick={() => router.push(`/notice/${notice.id}/edit?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
            className={role === 'Admin' ? 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors' : 'hidden'}
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className={role === 'Admin' ? 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors' : 'hidden'}
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/notice?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            목록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">등급</h3>
              <p className="mt-1 text-lg text-gray-900">
                {notice.level}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">제목</h3>
              <p className="mt-1 text-lg text-gray-900">
                {notice.title}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">내용</h3>
              <textarea
                id="text-input"
                name="content"
                value={notice.content ?? ''}
                rows={10}
                readOnly
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">작성자</h3>
              <p className="mt-1 text-lg text-gray-900">
                {notice.writer}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">생성일</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(notice.created, 'yyyy-MM-dd HH:mm:ss')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showUserModal && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-[800px] max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            메일을 보낼 사용자(총 {users.length === 0 ? '0' : users.length}명)
          </h2>
          <button
            onClick={() => setShowUserModal(false)}
            aria-label="닫기"
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

          {users.length === 0 ? (
            <p>등록된 사용자가 없습니다.</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 w-12">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectAll(checked);
                        setSelectedUsers(checked ? users.map((user) => user.id) : []);
                      }}
                    />
                  </th>
                  <th className="border border-gray-300 p-2 text-left">아이디</th>
                  <th className="border border-gray-300 p-2 text-left">Email</th>
                  <th className="border border-gray-300 p-2 text-left">이름</th>
                  <th className="border border-gray-300 p-2 text-left">회사</th>
                  <th className="border border-gray-300 p-2 text-left">타입</th>
                  <th className="border border-gray-300 p-2 text-left">등급</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          let updatedUsers;
                          if (e.target.checked) {
                            updatedUsers = [...selectedUsers, user.id];
                          } else {
                            updatedUsers = selectedUsers.filter(id => id !== user.id);
                          }
                          setSelectedUsers(updatedUsers);
                          setSelectAll(updatedUsers.length === users.length); // 모두 선택됐는지 확인
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">{user.username}</td>
                    <td className="border border-gray-300 p-2">{user.email}</td>
                    <td className="border border-gray-300 p-2">{user.firstName}</td>
                    <td className="border border-gray-300 p-2">{user.company}</td>
                    <td className="border border-gray-300 p-2">{user.type}</td>
                    <td className="border border-gray-300 p-2">{user.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowUserModal(false)}
              className="px-4 py-2 border rounded"
            >
              취소
            </button>
            <button
              onClick={async () => {
                if (selectedUsers.length === 0) {
                  alert('사용자를 선택해주세요.');
                  return;
                }
                try {
                  const selectedUserDetails = users.filter(user => selectedUsers.includes(user.id));
                  const response = await fetch(`/api/notice/${params.id}/sendMail`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ users: selectedUserDetails }),
                  });
                  if (!response.ok) throw new Error('메일 전송에 실패하였습니다.');
                  alert('메일이 전송되었습니다.');
                  setShowUserModal(false);
                  router.push(`/notice/${params.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
                } catch (err) {
                  alert(err instanceof Error ? err.message : '오류가 발생하였습니다.');
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}