import { useRouter } from "next/router";
import { formatDateTime } from "@/lib/format-date";

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
        {endPage < totalPages ? <span className="pagination-ellipsis">...</span> : null}
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

export function CustomerTable({ customers, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(customerId) {
    void router.push(`/customers/${customerId}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table customer-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>회사</th>
              <th>전화번호</th>
              <th>고객 관리 파트너 (회사)</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={5}>
                  고객 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={5}>
                  조회된 고객이 없습니다.
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr
                  key={`${customer.id}-${customer.name}`}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(customer.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(customer.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-customer-name">{customer.name}</td>
                  <td className="cell-customer-phone">{customer.phone}</td>
                  <td className="cell-customer-manager">{customer.manager}</td>
                  <td className="cell-customer-created">{formatDateTime(customer.createdAt)}</td>
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
