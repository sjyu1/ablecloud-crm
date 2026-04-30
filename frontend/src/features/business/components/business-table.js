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

export function BusinessTable({ businesses, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(businessId) {
    void router.push(`/businesses/${businessId}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>사업</th>
              <th>담당자 (회사)</th>
              <th>고객회사</th>
              <th>상태</th>
              <th>제품</th>
              <th>시작일</th>
              <th>종료일</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={8}>
                  사업 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={8}>
                  {error}
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={8}>
                  조회된 사업이 없습니다.
                </td>
              </tr>
            ) : (
              businesses.map((business, index) => (
                <tr
                  key={`${business.id}-${business.project}`}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(business.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(business.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-project">{business.project}</td>
                  <td className="cell-manager">{business.manager}</td>
                  <td className="cell-customer">{business.customer}</td>
                  <td className="cell-status-text">{business.status}</td>
                  <td className="cell-product">{business.product}</td>
                  <td className="cell-date">{formatDate(business.startDate)}</td>
                  <td className="cell-date">{formatDate(business.endDate)}</td>
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
