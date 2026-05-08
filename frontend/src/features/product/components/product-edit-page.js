import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

export function ProductEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [version, setVersion] = useState("");
  const [isoFilePath, setIsoFilePath] = useState("");
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
      setCategoryOptions(data.categoryOptions || []);
      setName(data.name || "");
      setCategoryId(String(data.categoryId || ""));
      setVersion(data.version || "");
      setIsoFilePath(data.isoFilePath || "");
    } catch (fetchError) {
      setProduct(null);
      setCategoryOptions([]);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    if (!name.trim()) {
      return "제품명을 입력해주세요.";
    }

    if (!categoryId) {
      return "제품 카테고리를 선택해주세요.";
    }

    if (!version.trim()) {
      return "제품버전을 입력해주세요.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("제품 정보를 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          categoryId,
          version,
          isoFilePath,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "제품 수정에 실패했습니다.");
      }

      await router.push(`/products/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/product" title="제품 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">제품 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && !error && product ? (
          <div className="license-create-grid">
            <label className="form-field">
              <span className="form-label">제품</span>
              <input className="form-control" type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">제품 카테고리</span>
              <select className="form-control" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">선택하세요</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">제품버전</span>
              <input className="form-control" type="text" value={version} onChange={(event) => setVersion(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">제품 ISO경로</span>
              <input
                className="form-control"
                type="text"
                placeholder="/v4.3.0/ABLESTACK-Diplo-v4.3.0.iso"
                value={isoFilePath}
                onChange={(event) => setIsoFilePath(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/products/${id}` : "/product"} legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? "수정 중..." : "수정"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
