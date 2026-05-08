import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { formatAmount } from "@/features/credit/format-credit";
import { getAuthToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";

function DetailField({ label, value, isTextarea = false }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      {isTextarea ? (
        <textarea className="detail-textarea" value={value || ""} readOnly />
      ) : (
        <p className="detail-value">{value || "-"}</p>
      )}
    </div>
  );
}

export function CreditDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [credit, setCredit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchCreditDetail(String(id));
  }, [router.isReady, id]);

  async function fetchCreditDetail(creditId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/credits/${creditId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("크레딧 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setCredit(data);
    } catch (fetchError) {
      setCredit(null);
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

    if (!window.confirm("이 크레딧을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/credits/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "크레딧 삭제에 실패했습니다.");
      }

      await router.push("/credit");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AdminLayout
      activePath="/credit"
      title="크레딧 상세정보"
      actions={
        <div className="page-actions">
          <Link href={id ? `/credits/${id}/edit` : "#"} legacyBehavior>
            <a className="action-square-button">수정</a>
          </Link>
          <button
            className="action-square-button action-square-button-danger"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
          <Link href="/credit" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">크레딧 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && credit ? (
          <div className="detail-grid">
            <DetailField label="파트너" value={credit.partner} />
            <DetailField label="사업" value={credit.business} />
            <DetailField label="고객회사" value={credit.customer} />
            <DetailField label="제품" value={credit.product} />
            <DetailField label="구매 크레딧" value={formatAmount(credit.deposit)} />
            <DetailField label="사용 크레딧" value={formatAmount(credit.credit)} />
            <DetailField label="생성일" value={formatDateTime(credit.createdAt)} />
            <DetailField label="수정일" value={formatDateTime(credit.updatedAt)} />
            <DetailField label="메모" value={credit.note} isTextarea />
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
