import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format-date";

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      <p className="detail-value">{value || "-"}</p>
    </div>
  );
}

function mapBusinessStatus(status) {
  const statusMap = {
    standby: "대기 중",
    meeting: "고객 미팅",
    poc: "PoC",
    bmt: "BMT",
    ordering: "발주",
    proposal: "제안",
    ordersuccess: "수주 성공",
    cancel: "취소",
  };

  return statusMap[status] || status || "-";
}

export function CustomerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("detail");

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchCustomerDetail(String(id));
  }, [router.isReady, id]);

  async function fetchCustomerDetail(customerId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/customers/${customerId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("고객 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setCustomer(data);
    } catch (fetchError) {
      setCustomer(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("이 고객을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/customers/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "고객 삭제에 실패했습니다.";
        window.alert(message);
        return;
      }

      await router.push("/customer");
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleManagerSelect(userId) {
    if (!userId) {
      return;
    }

    void router.push(`/users/${encodeURIComponent(userId)}`);
  }

  function handleBusinessSelect(businessId) {
    if (!businessId) {
      return;
    }

    void router.push(`/businesses/${encodeURIComponent(String(businessId))}`);
  }

  return (
    <AdminLayout
      activePath="/customer"
      title="고객 상세정보"
      actions={
        <div className="page-actions">
          <Link href={id ? `/customers/${id}/edit` : "#"} legacyBehavior>
            <a className="action-square-button">수정</a>
          </Link>
          <button className="action-square-button action-square-button-danger" type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
          <Link href="/customer" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="toolbar">
        <div className="tabs" aria-label="고객 상세 탭">
          <button className={activeTab === "detail" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("detail")}>
            상세정보
          </button>
          <button className={activeTab === "manager" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("manager")}>
            담당자
          </button>
          <button className={activeTab === "business" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("business")}>
            사업정보
          </button>
        </div>
      </section>

      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">고객 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && customer && activeTab === "detail" ? (
          <div className="detail-grid">
            <DetailField label="회사" value={customer.name} />
            <DetailField label="전화번호" value={customer.phone} />
            <DetailField label="고객 관리 파트너 (회사)" value={customer.manager} />
            <DetailField label="생성일" value={formatDateTime(customer.createdAt)} />
          </div>
        ) : null}
        {!isLoading && !error && customer && activeTab === "manager" ? (
          customer.managers && customer.managers.length > 0 ? (
            <section className="table-card">
              <div className="table-scroll">
                <table className="license-table partner-manager-table">
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>이메일</th>
                      <th>이름</th>
                      <th>전화번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.managers.map((manager) => (
                      <tr
                        key={`${manager.id}-${manager.email}`}
                        className="table-row-link"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleManagerSelect(manager.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleManagerSelect(manager.id);
                          }
                        }}
                      >
                        <td>{manager.id}</td>
                        <td>{manager.email}</td>
                        <td>{manager.name}</td>
                        <td>{manager.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <p className="detail-feedback">등록된 담당자 정보가 없습니다.</p>
          )
        ) : null}
        {!isLoading && !error && customer && activeTab === "business" ? (
          customer.businesses && customer.businesses.length > 0 ? (
            <section className="table-card">
              <div className="table-scroll">
                <table className="license-table customer-business-table">
                  <thead>
                    <tr>
                      <th>사업</th>
                      <th>담당자 (회사)</th>
                      <th>상태</th>
                      <th>제품</th>
                      <th>시작일</th>
                      <th>종료일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.businesses.map((business) => (
                      <tr
                        key={`${business.id}-${business.project}`}
                        className="table-row-link"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleBusinessSelect(business.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleBusinessSelect(business.id);
                          }
                        }}
                      >
                        <td>{business.project || "-"}</td>
                        <td>{business.manager || "-"}</td>
                        <td>{mapBusinessStatus(business.status)}</td>
                        <td>{business.product || "-"}</td>
                        <td>{formatDate(business.startDate)}</td>
                        <td>{formatDate(business.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <p className="detail-feedback">사업 정보가 없습니다.</p>
          )
        ) : null}
      </section>
    </AdminLayout>
  );
}
