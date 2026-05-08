import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      <p className="detail-value">{value || "-"}</p>
    </div>
  );
}

function formatCreditSummary(summary) {
  if (!summary) {
    return "";
  }

  return [summary.purchase, summary.use, summary.remaining]
    .map((value) => String(Number(value || 0)))
    .join(" | ");
}

export function PartnerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("detail");

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchPartnerDetail(String(id));
  }, [router.isReady, id]);

  async function fetchPartnerDetail(partnerId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/partners/${partnerId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("파트너 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setPartner(data);
    } catch (fetchError) {
      setPartner(null);
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

    if (!window.confirm("이 파트너를 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/partners/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "파트너 삭제에 실패했습니다.";
        window.alert(message);
        return;
      }

      await router.push("/partner");
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

  return (
    <AdminLayout
      activePath="/partner"
      title="파트너 상세정보"
      actions={
        <div className="page-actions">
          <Link href={id ? `/partners/${id}/edit` : "#"} legacyBehavior>
            <a className="action-square-button">수정</a>
          </Link>
          <button className="action-square-button action-square-button-danger" type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
          <Link href="/partner" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="toolbar">
        <div className="tabs" aria-label="파트너 상세 탭">
          <button className={activeTab === "detail" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("detail")}>
            상세정보
          </button>
          <button className={activeTab === "manager" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("manager")}>
            담당자
          </button>
        </div>
      </section>

      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">파트너 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && partner && activeTab === "detail" ? (
          <div className="detail-grid">
            <DetailField label="회사" value={partner.name} />
            <DetailField label="전화번호" value={partner.phone} />
            <DetailField label="등급" value={partner.grade} />
            <DetailField label="사용 제품 카테고리" value={partner.productCategory} />
            {partner.creditSummary ? (
              <DetailField
                label="크레딧(구매 | 사용 | 잔여 코어수)"
                value={formatCreditSummary(partner.creditSummary)}
              />
            ) : null}
            <DetailField label="생성일" value={formatDateTime(partner.createdAt)} />
          </div>
        ) : null}
        {!isLoading && !error && partner && activeTab === "manager" ? (
          partner.managers && partner.managers.length > 0 ? (
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
                    {partner.managers.map((manager) => (
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
      </section>
    </AdminLayout>
  );
}
