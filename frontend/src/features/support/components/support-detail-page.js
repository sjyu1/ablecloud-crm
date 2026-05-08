import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken, getRole } from "@/lib/auth";
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

function StatusField({ status, label }) {
  return (
    <div className="detail-field">
      <p className="detail-label">처리 상태</p>
      <span
        className={
          status === "complete"
            ? "status-pill detail-status-pill status-pill-active"
            : "status-pill detail-status-pill status-pill-processing"
        }
      >
        {label || "-"}
      </span>
    </div>
  );
}

export function SupportDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [support, setSupport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchSupportDetail(String(id));
  }, [router.isReady, id]);

  async function fetchSupportDetail(supportId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/supports/${supportId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("기술지원 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setSupport(data);
    } catch (fetchError) {
      setSupport(null);
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

    if (!window.confirm("이 기술지원을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/supports/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "기술지원 삭제에 실패했습니다.");
      }

      await router.push("/support");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AdminLayout
      activePath="/support"
      title="기술지원 상세정보"
      actions={
        <div className="page-actions">
          {getRole() === "admin" ? (
            <>
              <Link href={id ? `/supports/${id}/edit` : "#"} legacyBehavior>
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
            </>
          ) : null}
          <Link href="/support" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">기술지원 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && support ? (
          <div className="detail-grid">
            <DetailField label="고객회사" value={support.customer} />
            <DetailField label="사업" value={support.business} />
            <DetailField label="제품" value={support.product} />
            <DetailField label="접수일" value={support.issued} />
            <DetailField label="지원 유형" value={support.typeLabel} />
            <StatusField status={support.status} label={support.statusLabel} />
            <DetailField label="처리일" value={support.actioned} />
            <DetailField label="처리 방식" value={support.actionTypeLabel} />
            <DetailField label="담당자" value={support.manager} />
            <DetailField label="요청자" value={support.requester} />
            <DetailField label="요청자 전화번호" value={support.requesterTelnum} />
            <DetailField label="요청자 이메일" value={support.requesterEmail} />
            <DetailField label="작성자" value={support.writer} />
            <DetailField label="등록일" value={formatDateTime(support.createdAt)} />
            <DetailField label="수정일" value={formatDateTime(support.updatedAt)} />
            <DetailField label="문의내용" value={support.issue} isTextarea />
            <DetailField label="처리내용" value={support.solution} isTextarea />
            <DetailField label="메모" value={support.note} isTextarea />
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
