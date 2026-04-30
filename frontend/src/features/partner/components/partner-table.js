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

export function PartnerTable({ partners, isLoading, error, pagination, onPageChange }) {
  const router = useRouter();
  const startNumber = pagination.total - (pagination.page - 1) * pagination.limit;

  function handleRowSelect(partnerId) {
    void router.push(`/partners/${partnerId}`);
  }

  return (
    <section className="table-card">
      <div className="table-scroll">
        <table className="license-table partner-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>회사명</th>
              <th>전화번호</th>
              <th>등급</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-feedback" colSpan={5}>
                  파트너 데이터를 불러오는 중입니다.
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="table-feedback table-feedback-error" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : partners.length === 0 ? (
              <tr>
                <td className="table-feedback" colSpan={5}>
                  조회된 파트너가 없습니다.
                </td>
              </tr>
            ) : (
              partners.map((partner, index) => (
                <tr
                  key={`${partner.id}-${partner.name}`}
                  className="table-row-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowSelect(partner.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowSelect(partner.id);
                    }
                  }}
                >
                  <td className="cell-number">{startNumber - index}</td>
                  <td className="cell-partner-name">{partner.name}</td>
                  <td className="cell-partner-phone">{partner.phone}</td>
                  <td className="cell-partner-grade">{partner.grade}</td>
                  <td className="cell-partner-created">{formatDateTime(partner.createdAt)}</td>
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
