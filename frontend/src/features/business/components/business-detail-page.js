import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";
import { MarkdownContent } from "@/lib/markdown";

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

export function BusinessDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState("");
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [versionError, setVersionError] = useState("");
  const [activeTab, setActiveTab] = useState("detail");
  const [version, setVersion] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchBusinessDetail(String(id));
  }, [router.isReady, id]);

  async function fetchBusinessDetail(businessId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/businesses/${businessId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사업 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setBusiness(data);
    } catch (fetchError) {
      setBusiness(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function openVersionModal() {
    setVersionError("");
    setIsVersionModalOpen(true);
  }

  function closeVersionModal() {
    if (isSubmittingVersion) {
      return;
    }

    setVersion("");
    setNote("");
    setVersionError("");
    setIsVersionModalOpen(false);
  }

  async function handleVersionSubmit(event) {
    event.preventDefault();

    if (!version.trim()) {
      setVersionError("제품버전을 입력해주세요.");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setVersionError("로그인이 필요합니다.");
      return;
    }

    setVersionError("");
    setIsSubmittingVersion(true);

    try {
      const response = await fetch(`${apiBaseUrl}/businesses/${id}/product-versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          version,
          note,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "제품버전 등록에 실패했습니다.");
      }

      setVersion("");
      setNote("");
      setIsVersionModalOpen(false);
      await fetchBusinessDetail(String(id));
    } catch (submitError) {
      setVersionError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmittingVersion(false);
    }
  }

  async function handleDelete() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    const shouldDelete = window.confirm("이 사업을 삭제하시겠습니까?");

    if (!shouldDelete) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/businesses/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "사업 삭제에 실패했습니다.";
        window.alert(message);
        return;
      }

      await router.push("/business");
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleVersionDelete(versionId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!versionId || !window.confirm("이 제품버전을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setDeletingVersionId(String(versionId));

    try {
      const response = await fetch(`${apiBaseUrl}/businesses/${id}/product-versions/${versionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "제품버전 삭제에 실패했습니다.");
      }

      await fetchBusinessDetail(String(id));
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setDeletingVersionId("");
    }
  }

  return (
    <AdminLayout
      activePath="/business"
      title="사업 상세정보"
      actions={
        <div className="page-actions">
          <Link href={id ? `/businesses/${id}/edit` : "#"} legacyBehavior>
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
          <Link href="/business" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="toolbar">
        <div className="tabs" aria-label="사업 상세 탭">
          <button
            className={activeTab === "detail" ? "tab is-active" : "tab"}
            type="button"
            onClick={() => setActiveTab("detail")}
          >
            상세정보
          </button>
          <button
            className={activeTab === "license" ? "tab is-active" : "tab"}
            type="button"
            onClick={() => setActiveTab("license")}
          >
            라이선스 정보
          </button>
          <button
            className={activeTab === "version-history" ? "tab is-active" : "tab"}
            type="button"
            onClick={() => setActiveTab("version-history")}
          >
            제품버전 히스토리
          </button>
        </div>
      </section>

      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">사업 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && business && activeTab === "detail" ? (
          <div className="detail-grid">
            <DetailField label="사업" value={business.project} />
            <DetailField label="사업 담당자" value={`${business.manager} (${business.managerCompany})`} />
            <DetailField label="고객회사" value={business.customer} />
            <DetailField label="제품" value={business.product} />
            <DetailField label="노드수" value={String(business.nodeCount)} />
            <DetailField label="코어수" value={String(business.coreCount)} />
            <DetailField label="사업 상태" value={business.status} />
            <DetailField label="사업 시작일" value={business.startDate} />
            <DetailField label="사업 종료일" value={business.endDate} />
            <DetailField label="세부사항" value={business.details} isTextarea />
          </div>
        ) : null}
        {!isLoading && !error && business && activeTab === "license" ? (
          business.license ? (
            <div className="detail-grid">
              <DetailField label="라이선스 키" value={business.license.key} />
              <div className="detail-field">
                <p className="detail-label">상태</p>
                <span
                  className={
                    business.license.status === "활성"
                      ? "status-pill detail-status-pill status-pill-active"
                      : "status-pill detail-status-pill status-pill-inactive"
                  }
                >
                  {business.license.status}
                </span>
              </div>
              <DetailField label="Trial" value={business.license.trial ? "o" : "-"} />
              <DetailField label="시작일" value={business.license.startDate} />
              <DetailField label="만료일" value={business.license.endDate} />
            </div>
          ) : (
            <p className="detail-feedback">라이선스 정보가 없습니다.</p>
          )
        ) : null}
        {!isLoading && !error && business && activeTab === "version-history" ? (
          <div className="business-version-history-panel">
            <div className="business-version-toolbar">
              <button className="primary-button" type="button" onClick={openVersionModal}>
                버전 등록
              </button>
            </div>

            {business.versionHistory && business.versionHistory.length > 0 ? (
              <div className="table-scroll">
                <table className="license-table business-version-history-table">
                  <thead>
                    <tr>
                      <th>버전</th>
                      <th>노트</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {business.versionHistory.map((history) => (
                      <tr key={history.id}>
                        <td className="cell-version">{history.version || "-"}</td>
                        <td className="cell-version-history-contents">
                          {history.note ? <MarkdownContent source={history.note} /> : "-"}
                        </td>
                        <td className="cell-version-history-actions">
                          <button
                            className="action-button action-button-muted"
                            type="button"
                            onClick={() => handleVersionDelete(history.id)}
                            disabled={deletingVersionId === String(history.id)}
                          >
                            {deletingVersionId === String(history.id) ? "삭제 중" : "삭제"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="detail-feedback">제품버전 히스토리가 없습니다.</p>
            )}
          </div>
        ) : null}
      </section>
      {isVersionModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeVersionModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-version-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="business-version-modal-title" className="detail-section-title">
              제품버전 등록
            </h2>
            <form onSubmit={handleVersionSubmit}>
              <div className="business-version-form-grid">
                <label className="form-field">
                  <span className="form-label">제품버전</span>
                  <input
                    className="form-control"
                    type="text"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                  />
                </label>
                <label className="form-field business-version-note-field">
                  <span className="form-label">노트</span>
                  <textarea
                    className="detail-textarea detail-textarea-edit business-version-note-textarea"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
              </div>
              {versionError ? <p className="form-feedback form-feedback-error">{versionError}</p> : null}
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={closeVersionModal} disabled={isSubmittingVersion}>
                  취소
                </button>
                <button className="primary-button" type="submit" disabled={isSubmittingVersion}>
                  {isSubmittingVersion ? "등록 중" : "버전 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
