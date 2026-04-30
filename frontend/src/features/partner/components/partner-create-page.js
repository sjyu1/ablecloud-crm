import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

const PARTNER_LEVELS = ["PLATINUM", "GOLD", "SILVER", "VAR"];

export function PartnerCreatePage() {
  const router = useRouter();
  const [productCategories, setProductCategories] = useState([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("PLATINUM");
  const [telnum, setTelnum] = useState("");
  const [selectedProductCategories, setSelectedProductCategories] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetchFormOptions();
  }, []);

  async function fetchFormOptions() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/products/meta/options`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("제품 카테고리 옵션을 불러오지 못했습니다.");
      }

      const data = await response.json();
      const nextCategories = (data.categoryOptions || [])
        .map((option) => ({
          id: String(option.id || "").trim(),
          label: String(option.label || "").trim(),
        }))
        .filter((option) => option.id && option.label);
      setProductCategories(nextCategories);
      setSelectedProductCategories(nextCategories.length > 0 ? [nextCategories[0].id] : []);
    } catch (fetchError) {
      setProductCategories([]);
      setSelectedProductCategories([]);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleProductCategory(category) {
    setSelectedProductCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function validateForm() {
    if (!name.trim()) {
      return "회사명을 입력해주세요.";
    }

    if (!telnum.trim()) {
      return "전화번호를 입력해주세요.";
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

    if (!window.confirm("파트너를 등록하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/partners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          level,
          telnum,
          productCategory: selectedProductCategories,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "파트너 등록에 실패했습니다.");
      }

      await router.push("/partner");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/partner" title="파트너 등록" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">제품 카테고리 옵션을 불러오는 중입니다.</p> : null}
        <div className="license-create-grid">
          <label className="form-field">
            <span className="form-label">회사</span>
            <input className="form-control" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-label">전화번호 (- 포함)</span>
            <input
              className="form-control"
              type="text"
              placeholder="010-1234-5678"
              value={telnum}
              onChange={(event) => setTelnum(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">등급</span>
            <select className="form-control" value={level} onChange={(event) => setLevel(event.target.value)}>
              {PARTNER_LEVELS.map((partnerLevel) => (
                <option key={partnerLevel} value={partnerLevel}>
                  {partnerLevel}
                </option>
              ))}
            </select>
          </label>

          <div className="form-field">
            <span className="form-label">제품 카테고리</span>
            <div className="partner-category-box">
              {productCategories.map((category) => (
                <label key={category.id} className="partner-category-option">
                  <input
                    type="checkbox"
                    checked={selectedProductCategories.includes(category.id)}
                    onChange={() => toggleProductCategory(category.id)}
                    disabled={isLoading}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href="/partner" legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
