import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken, getRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";

function DetailField({ label, value, status, children }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      {children ? (
        <p className="detail-value">{children}</p>
      ) : status ? (
        <span
          className={
            status === "활성"
              ? "status-pill detail-status-pill status-pill-active"
              : "status-pill detail-status-pill status-pill-inactive"
          }
        >
          {status}
        </span>
      ) : (
        <p className="detail-value">{value || "-"}</p>
      )}
    </div>
  );
}

export function LicenseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [license, setLicense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const currentRole = getRole();
  const canApprove = currentRole === "admin" && license?.status === "비활성";
  const canDownload = license?.status === "활성";

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchLicenseDetail(String(id));
  }, [router.isReady, id]);

  async function fetchLicenseDetail(licenseId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/licenses/${licenseId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("라이선스 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setLicense(data);
    } catch (fetchError) {
      setLicense(null);
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

    const shouldDelete = window.confirm("이 라이선스를 삭제하시겠습니까?");

    if (!shouldDelete) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/licenses/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "라이선스 삭제에 실패했습니다.");
      }

      await router.push("/");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleApprove() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    const shouldApprove = window.confirm("이 라이선스를 승인하시겠습니까?");

    if (!shouldApprove) {
      return;
    }

    setError("");
    setIsApproving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/licenses/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "라이선스 승인에 실패했습니다.");
      }

      await fetchLicenseDetail(String(id));
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleDownload() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    const shouldDownload = window.confirm("이 라이선스를 다운로드하시겠습니까?");

    if (!shouldDownload) {
      return;
    }

    setError("");
    setIsDownloading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/licenses/${id}/download`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        let message = "라이선스 파일 다운로드에 실패했습니다.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch (parseError) {
          // Ignore non-JSON error responses.
        }

        throw new Error(message);
      }

      const disposition = response.headers.get("content-disposition") || "";
      const matchedFileName = disposition.match(/filename="([^"]+)"/);
      const filename = matchedFileName?.[1] || `${Date.now()}`;
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <AdminLayout
      activePath="/"
      title="라이선스 상세정보"
      actions={
        <div className="page-actions">
          {canApprove ? (
            <button className="action-square-button" type="button" onClick={handleApprove} disabled={isApproving}>
              {isApproving ? "승인 중" : "승인"}
            </button>
          ) : null}
          {canDownload ? (
            <button className="action-square-button" type="button" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? "다운로드 중" : "다운로드"}
            </button>
          ) : null}
          {getRole() === "admin" ? (
            <Link href={id ? `/licenses/${id}/edit` : "#"} legacyBehavior>
              <a className="action-square-button">수정</a>
            </Link>
          ) : null}
          {getRole() === "admin" ? (
            <button
              className="action-square-button action-square-button-danger"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중" : "삭제"}
            </button>
          ) : null}
          <Link href="/" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">라이선스 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && license ? (
          <div className="detail-grid">
            <DetailField label="라이선스키" value={license.key} />
            <DetailField label="제품">
              {license.productId ? (
                <Link href={`/products/${license.productId}`} legacyBehavior>
                  <a>{license.product || "-"}</a>
                </Link>
              ) : (
                license.product || "-"
              )}
            </DetailField>
            <DetailField label="상태" status={license.status} />
            <DetailField label="사업">
              {license.businessId ? (
                <Link href={`/businesses/${license.businessId}`} legacyBehavior>
                  <a>{license.project || "-"}</a>
                </Link>
              ) : (
                license.project || "-"
              )}
            </DetailField>
            <DetailField label="시작일" value={license.startDate} />
            <DetailField label="만료일" value={license.endDate} />
            <DetailField label="발급자" value={license.issuer} />
            <DetailField label="Trial" value={license.trialLabel || 'o'} />
            <DetailField label="oem" value={license.oem} />
            <DetailField label="발급자 회사" value={license.issuerCompany} />
            <DetailField label="발급일" value={formatDateTime(license.createdAt)} />
            <DetailField label="승인자" value={license.approver} />
            <DetailField label="승인일" value={license.approvedAt && !isNaN(new Date(license.approvedAt)) ? formatDateTime(license.approvedAt) : '-'} />
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
