import { useRouter } from "next/router";
import { formatDateTime } from "@/lib/format-date";
import { formatAmount } from "@/features/credit/format-credit";

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

export function CreditTable({ credits, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(creditId) {
    void router.push(`/credits/${creditId}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table credit-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>파트너</th>
              <th>사업</th>
              <th>구매 크레딧</th>
              <th>사용 크레딧</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={6}>
                  크레딧 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={6}>
                  {error}
                </td>
              </tr>
            ) : credits.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={6}>
                  조회된 크레딧이 없습니다.
                </td>
              </tr>
            ) : (
              credits.map((credit, index) => (
                <tr
                  key={credit.id}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(credit.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(credit.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-partner-name">{credit.partner}</td>
                  <td className="cell-project">{credit.business}</td>
                  <td className="cell-amount">{formatAmount(credit.deposit)}</td>
                  <td className="cell-amount">{formatAmount(credit.credit)}</td>
                  <td className="cell-partner-created">{formatDateTime(credit.createdAt)}</td>
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
