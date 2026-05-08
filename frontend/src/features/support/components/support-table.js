import { useRouter } from "next/router";
import { formatDate } from "@/lib/format-date";

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
    <div className="pagination">
      <p className="pagination-summary">
        총 <strong>{pagination.total}</strong>건 중 {pagination.page} / {totalPages} 페이지
      </p>
      <div className="pagination-controls">
        <button
          className="pagination-button"
          type="button"
          disabled={pagination.page === 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          이전
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
          다음
        </button>
      </div>
    </div>
  );
}

function DisplayDate({ value }) {
  if (!value || value === "-") {
    return "-";
  }

  return formatDate(value);
}

export function SupportTable({ supports, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(supportId) {
    void router.push(`/supports/${supportId}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table support-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>접수일</th>
              <th>고객회사</th>
              <th>사업</th>
              <th>유형</th>
              <th>문의내용</th>
              {/* <th>처리방식</th> */}
              <th>담당자</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={8}>
                  기술지원 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={8}>
                  {error}
                </td>
              </tr>
            ) : supports.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={8}>
                  조회된 기술지원이 없습니다.
                </td>
              </tr>
            ) : (
              supports.map((support, index) => (
                <tr
                  key={support.id}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(support.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(support.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-date">
                    <DisplayDate value={support.issued} />
                  </td>
                  <td className="cell-customer">{support.customer}</td>
                  <td className="cell-project">{support.business}</td>
                  <td className="cell-support-type">{support.type}</td>
                  <td className="cell-support-issue">{support.issue}</td>
                  {/* <td className="cell-support-action">{support.actionType}</td> */}
                  <td className="cell-support-manager">{support.manager}</td>
                  <td className="cell-status-text">{support.status}</td>
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
