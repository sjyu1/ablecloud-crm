import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken, getRole } from "@/lib/auth";

const PARTNER_LEVELS = ["PLATINUM", "GOLD", "SILVER", "VAR"];

export function PartnerEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [partner, setPartner] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("PLATINUM");
  const [telnum, setTelnum] = useState("");
  const [selectedProductCategories, setSelectedProductCategories] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchFormData(String(id));
  }, [router.isReady, id]);

  async function fetchFormData(partnerId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const [partnerResponse, optionsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/partners/${partnerId}`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${apiBaseUrl}/products/meta/options`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (!partnerResponse.ok) {
        throw new Error("파트너 정보를 불러오지 못했습니다.");
      }

      if (!optionsResponse.ok) {
        throw new Error("제품 카테고리 옵션을 불러오지 못했습니다.");
      }

      const partnerData = await partnerResponse.json();
      const optionsData = await optionsResponse.json();
      const nextCategories = (optionsData.categoryOptions || [])
        .map((option) => ({
          id: String(option.id || "").trim(),
          label: String(option.label || "").trim(),
        }))
        .filter((option) => option.id && option.label);
      const categoryIdByLabel = nextCategories.reduce((acc, category) => {
        acc[category.label] = category.id;
        return acc;
      }, {});
      const nextSelectedCategories = String(partnerData.productCategoryIds || partnerData.productCategory || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => categoryIdByLabel[item] || item);

      setPartner(partnerData);
      setProductCategories(nextCategories);
      setName(partnerData.name || "");
      setLevel(partnerData.grade || "PLATINUM");
      setTelnum(partnerData.phone || "");
      setSelectedProductCategories(nextSelectedCategories);
    } catch (fetchError) {
      setPartner(null);
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

    if (!window.confirm("파트너 정보를 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/partners/${id}`, {
        method: "PATCH",
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
        throw new Error(data.message || "파트너 수정에 실패했습니다.");
      }

      await router.push(`/partners/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/partner" title="파트너 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">파트너 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && !error && partner ? (
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

            {getRole() === "admin" ? (
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
            ) : null}

            {getRole() === "admin" ? (
              <div className="form-field">
                <span className="form-label">제품 카테고리</span>
                <div className="partner-category-box">
                  {productCategories.map((category) => (
                    <label key={category.id} className="partner-category-option">
                      <input
                        type="checkbox"
                        checked={selectedProductCategories.includes(category.id)}
                        onChange={() => toggleProductCategory(category.id)}
                      />
                      <span>{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/partners/${id}` : "/partner"} legacyBehavior>
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
