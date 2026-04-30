import { useRouter } from "next/router";

function Pagination({ pagination, onPageChange }) {
  const totalPages = Math.max(Math.ceil(pagination.total / pagination.limit), 1);
  const currentGroup = Math.floor((pagination.page - 1) / 5);
  const startPage = currentGroup * 5 + 1;
  const endPage = Math.min(startPage + 4, totalPages);
  const pages = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="pagination pagination-product">
      <div className="pagination-controls pagination-controls-center">
        <button
          className="pagination-button"
          type="button"
          disabled={pagination.page === 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          &lt;
        </button>
        {pages.map((page) => (
          <button
            key={page}
            className={page === pagination.page ? "pagination-button is-active" : "pagination-button"}
            type="button"
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="pagination-button"
          type="button"
          disabled={pagination.page >= totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          &gt;
        </button>
        <p className="pagination-summary pagination-summary-inline">전체 {pagination.total}개 항목</p>
      </div>
    </div>
  );
}

export function UserTable({ users, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(userId) {
    void router.push(`/users/${encodeURIComponent(userId)}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table user-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>아이디</th>
              <th>이메일</th>
              <th>이름</th>
              <th>권한</th>
              <th>회사</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={6}>
                  사용자 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={6}>
                  {error}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={6}>
                  조회된 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={`${user.id}-${user.email}`}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(user.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(user.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-user-id">{user.id}</td>
                  <td className="cell-user-email">{user.email}</td>
                  <td className="cell-user-name">{user.name}</td>
                  <td className="cell-user-role">{user.role}</td>
                  <td className="cell-user-company">{user.company}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && !error && pagination.total > 0 ? (
        <Pagination onPageChange={onPageChange} pagination={pagination} />
      ) : null}
    </section>
  );
}
