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

export function ProductTable({ products, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(productId) {
    void router.push(`/products/${productId}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table product-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>제품명</th>
              <th>버전</th>
              <th>생성일</th>
              <th>활성화 여부</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={5}>
                  제품 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={5}>
                  조회된 제품이 없습니다.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr
                  key={`${product.id}-${product.name}`}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(product.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(product.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-project">{product.name}</td>
                  <td className="cell-version">{product.version}</td>
                  <td className="cell-date">{formatDateTime(product.createdAt)}</td>
                  <td className="cell-status-text">{product.enabledLabel}</td>
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
