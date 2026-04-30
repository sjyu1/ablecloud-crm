import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken, getRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";
import { MarkdownContent } from "@/lib/markdown";

function DetailField({ label, value, children }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      {children || <p className="detail-value">{value || "-"}</p>}
    </div>
  );
}

function formatFileSize(size) {
  const bytes = Number(size || 0);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const FILE_TAB_LABELS = {
  addon: "ADDON",
  template: "TEMPLATE",
  patch: "PATCH",
};

export function ProductDetailPage() {
  const router = useRouter();
  const { id, tab } = router.query;
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileKey, setDownloadingFileKey] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("detail");
  const [fileTabs, setFileTabs] = useState({
    addon: { items: [], isLoading: false, error: "" },
    template: { items: [], isLoading: false, error: "" },
    patch: { items: [], isLoading: false, error: "" },
  });

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchProductDetail(String(id));
  }, [router.isReady, id]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (typeof tab === "string" && ["detail", "release-note", "addon", "template", "patch"].includes(tab)) {
      setActiveTab(tab);
      return;
    }

    setActiveTab("detail");
  }, [router.isReady, tab]);

  useEffect(() => {
    if (!router.isReady || !["addon", "template", "patch"].includes(activeTab)) {
      return;
    }

    void fetchProductFiles(activeTab);
  }, [router.isReady, activeTab]);

  async function fetchProductDetail(productId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("제품 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setProduct(data);
    } catch (fetchError) {
      setProduct(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductFiles(fileType) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const label = FILE_TAB_LABELS[fileType] || "파일";

    setFileTabs((current) => ({
      ...current,
      [fileType]: {
        ...current[fileType],
        isLoading: true,
        error: "",
      },
    }));

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/products/files/${fileType}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`${label} 파일 목록을 불러오지 못했습니다.`);
      }

      const data = await response.json();
      setFileTabs((current) => ({
        ...current,
        [fileType]: {
          items: data.items || [],
          isLoading: false,
          error: "",
        },
      }));
    } catch (fetchError) {
      setFileTabs((current) => ({
        ...current,
        [fileType]: {
          items: [],
          isLoading: false,
          error: fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.",
        },
      }));
    }
  }

  async function handleToggleEnabled() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const nextEnabled = !product?.enabled;
    const confirmMessage = nextEnabled ? "제품을 활성화하시겠습니까?" : "제품을 비활성화하시겠습니까?";

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!product || !window.confirm(confirmMessage)) {
      return;
    }

    setError("");
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`${apiBaseUrl}/products/${id}/enabled`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          enabled: nextEnabled,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "제품 활성화 상태 변경에 실패했습니다.");
      }

      await fetchProductDetail(String(id));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("이 제품을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/products/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "제품 삭제에 실패했습니다.");
      }

      await router.push("/product");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDownload() {
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!product?.downloadFileName) {
      setError("다운로드할 제품 ISO 파일이 없습니다.");
      return;
    }

    if (!window.confirm("제품 ISO 파일을 다운로드하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDownloading(true);

    const anchor = document.createElement("a");

    anchor.href = `/api/products/${encodeURIComponent(String(id))}/download`;
    anchor.download = product.downloadFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      setIsDownloading(false);
    }, 1000);
  }

  function handleProductFileDownload(fileType, file) {
    const label = FILE_TAB_LABELS[fileType] || "파일";

    if (!file?.name) {
      setError(`다운로드할 ${label} 파일이 없습니다.`);
      return;
    }

    setError("");
    setDownloadingFileKey(`${fileType}:${file.name}`);

    const anchor = document.createElement("a");

    anchor.href = `/api/products/files/${encodeURIComponent(fileType)}/${encodeURIComponent(file.name)}/download`;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      setDownloadingFileKey("");
    }, 1000);
  }

  return (
    <AdminLayout
      activePath="/product"
      title="제품 상세정보"
      actions={
        <div className="page-actions">
          {getRole() === "admin" ? (
            <>
              <Link href={id ? `/products/${id}/edit` : "#"} legacyBehavior>
                <a className="action-square-button">수정</a>
              </Link>
              <button className="action-square-button" type="button" onClick={handleToggleEnabled} disabled={isUpdatingStatus || isLoading}>
                {isUpdatingStatus ? "변경 중" : product?.enabled ? "제품 비활성화" : "제품 활성화"}
              </button>
              <button className="action-square-button action-square-button-danger" type="button" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "삭제 중" : "삭제"}
              </button>
            </>
          ) : null}
          <Link href="/product" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="toolbar">
        <div className="tabs" aria-label="제품 상세 탭">
          <button className={activeTab === "detail" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("detail")}>
            상세정보
          </button>
          <button className={activeTab === "release-note" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("release-note")}>
            릴리즈노트
          </button>
          <button className={activeTab === "addon" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("addon")}>
            ADDON
          </button>
          <button className={activeTab === "template" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("template")}>
            TEMPLATE
          </button>
          <button className={activeTab === "patch" ? "tab is-active" : "tab"} type="button" onClick={() => setActiveTab("patch")}>
            PATCH
          </button>
        </div>
      </section>

      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">제품 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && product && activeTab === "detail" ? (
          <div className="detail-grid">
            <DetailField label="제품" value={product.name} />
            <DetailField label="제품 카테고리" value={product.category} />
            <DetailField label="제품버전" value={product.version} />
            <DetailField label="활성화 여부" value={product.enabledLabel} />
            <DetailField label="제품 다운로드">
              <p className="detail-value">
                {product.downloadFileName ? (
                  <button className="action-button action-button-primary" type="button" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? "다운로드 중" : "다운로드"}
                  </button>
                ) : "-"}
              </p>
            </DetailField>
            <DetailField label="제품 Checksum(MD5S)" value={product.checksumLabel} />
            <DetailField label="생성일" value={formatDateTime(product.createdAt)} />
          </div>
        ) : null}
        {!isLoading && !error && product && activeTab === "release-note" ? (
          <div className="detail-tab-panel">
            {getRole() === "admin" ? (
              <div className="detail-tab-toolbar">
                <Link href={id ? `/products/${id}/release-note` : "#"} legacyBehavior>
                  <a className="action-square-button">릴리즈노트 등록 및 수정</a>
                </Link>
              </div>
            ) : null}
            {product.contents ? (
              <div className="detail-grid">
                <DetailField label="릴리즈노트">
                  <MarkdownContent source={product.contents} />
                </DetailField>
              </div>
            ) : (
              <p className="detail-feedback">등록된 릴리즈노트가 없습니다.</p>
            )}
          </div>
        ) : null}
        {!isLoading && !error && product && ["addon", "template", "patch"].includes(activeTab) ? (
          <section className="table-card">
            <div className="table-scroll">
              <table className="license-table product-table">
                <thead>
                  <tr>
                    <th>파일명</th>
                    <th>유형</th>
                    <th>크기</th>
                    <th>수정일</th>
                    <th>다운로드</th>
                  </tr>
                </thead>
                <tbody>
                  {fileTabs[activeTab].isLoading ? (
                    <tr>
                      <td className="table-feedback" colSpan={5}>
                        {FILE_TAB_LABELS[activeTab]} 파일 목록을 불러오는 중입니다.
                      </td>
                    </tr>
                  ) : fileTabs[activeTab].error ? (
                    <tr>
                      <td className="table-feedback table-feedback-error" colSpan={5}>
                        {fileTabs[activeTab].error}
                      </td>
                    </tr>
                  ) : fileTabs[activeTab].items.length === 0 ? (
                    <tr>
                      <td className="table-feedback" colSpan={5}>
                        등록된 {FILE_TAB_LABELS[activeTab]} 파일이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    fileTabs[activeTab].items.map((file) => (
                      <tr key={file.name}>
                        <td>{file.name}</td>
                        <td>{file.type || "-"}</td>
                        <td>{formatFileSize(file.size)}</td>
                        <td>{formatDateTime(file.updatedAt)}</td>
                        <td>
                          <button
                            className="action-button action-button-primary"
                            type="button"
                            onClick={() => handleProductFileDownload(activeTab, file)}
                            disabled={downloadingFileKey === `${activeTab}:${file.name}`}
                          >
                            {downloadingFileKey === `${activeTab}:${file.name}` ? "다운로드 중" : "다운로드"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </section>
    </AdminLayout>
  );
}
