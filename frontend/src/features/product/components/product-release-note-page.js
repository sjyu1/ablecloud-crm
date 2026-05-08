import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";
import { MarkdownContent, normalizeMarkdownSource } from "@/lib/markdown";

export function ProductReleaseNotePage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [contents, setContents] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchProductDetail(String(id));
  }, [router.isReady, id]);

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
        throw new Error("제품 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setProduct(data);
      setContents(normalizeMarkdownSource(data.contents || ""));
    } catch (fetchError) {
      setProduct(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("릴리즈노트를 저장하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/products/${id}/release-note`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          contents,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "릴리즈노트 저장에 실패했습니다.");
      }

      await router.push(`/products/${id}?tab=release-note`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/product" title="릴리즈노트 등록 및 수정" actions={null}>
      <form className="license-create-card release-note-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">제품 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && !error && product ? (
          <div className="release-note-editor">
            <div className="release-note-panel">
              <div className="release-note-header">
                <p className="release-note-title">Markdown 입력</p>
                <p className="release-note-subtitle">
                  {product.name} {product.version ? `(v${product.version})` : ""}
                </p>
              </div>
              <label className="form-field">
                <span className="form-label">릴리즈노트 본문</span>
                <textarea
                  className="detail-textarea detail-textarea-edit release-note-textarea"
                  value={contents}
                  onChange={(event) => setContents(event.target.value)}
                  placeholder={"# 릴리즈 노트\n\n## 버전 정보\n- ISO Version : 4.6.1\n\n---\n\n<details>\n<summary>지난 릴리즈 노트</summary>\n\nCUBE Release Note : https://example.com\n</details>"}
                />
              </label>
            </div>

            <div className="release-note-panel">
              <div className="release-note-header">
                <p className="release-note-title">미리보기</p>
                <p className="release-note-subtitle">저장 전에 실제 표시 형태를 확인할 수 있습니다.</p>
              </div>
              <div className="release-note-preview">
                {contents.trim() ? <MarkdownContent source={contents} /> : <p className="detail-feedback">입력된 릴리즈노트가 없습니다.</p>}
              </div>
            </div>
          </div>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/products/${id}` : "/product"} legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
