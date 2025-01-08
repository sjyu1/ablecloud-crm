'use client';

import { useBoardStore } from '@/app/store/boardStore';

export default function DashboardPage() {
  const { boards } = useBoardStore();

  // 통계 계산
  const totalPosts = boards.length;
  const totalViews = boards.reduce((sum, board) => sum + board.views, 0);
  const recentPosts = boards.slice(0, 5);

  const stats = [
    { name: '전체 게시글', value: totalPosts, icon: '📝' },
    { name: '전체 조회수', value: totalViews, icon: '👀' },
    { name: '최근 게시글', value: recentPosts.length, icon: '🔥' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 최근 게시글 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            최근 게시글
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    제목
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    작성자
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    작성일
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    조회수
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <a href={`/view/${post.id}`} className="text-blue-600 hover:underline">
                        {post.title}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{post.author}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{post.views}</td>
                  </tr>
                ))}
                {recentPosts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      게시글이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 차트나 그래프를 추가하고 싶다면 여기에 추가 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            활동 통계
          </h2>
          {/* 차트 컴포넌트를 여기에 추가 */}
          <div className="h-64 flex items-center justify-center text-gray-500">
            차트가 들어갈 자리입니다
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            사용자 활동
          </h2>
          {/* 차트 컴포넌트를 여기에 추가 */}
          <div className="h-64 flex items-center justify-center text-gray-500">
            차트가 들어갈 자리입니다
          </div>
        </div>
      </div>
    </div>
  );
} 