import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

function sortManagerOptions(options) {
  return [...options].sort((left, right) =>
    String(left?.label || "").localeCompare(String(right?.label || ""), "ko")
  );
}

export function CustomerEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState("");
  const [telnum, setTelnum] = useState("");
  const [managerOptions, setManagerOptions] = useState([]);
  const [managerId, setManagerId] = useState("");
  const [managerCompanyId, setManagerCompanyId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchCustomerForm(String(id));
  }, [router.isReady, id]);

  async function fetchCustomerForm(customerId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const [detailResponse, optionsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/customers/${customerId}`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${apiBaseUrl}/customers/meta/options`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (!detailResponse.ok) {
        throw new Error("고객 상세 정보를 불러오지 못했습니다.");
      }

      if (!optionsResponse.ok) {
        throw new Error("고객 등록 옵션을 불러오지 못했습니다.");
      }

      const detailData = await detailResponse.json();
      const optionsData = await optionsResponse.json();
      const nextManagerOptions = sortManagerOptions(optionsData.managerOptions || []);

      setManagerOptions(nextManagerOptions);
      setName(detailData.name || "");
      setTelnum(detailData.phone || "");
      setManagerId(String(detailData.managerId || ""));
      setManagerCompanyId(String(detailData.managerCompanyId || ""));
    } catch (fetchError) {
      setManagerOptions([]);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleManagerChange(event) {
    const nextManagerId = event.target.value;
    const selectedManager = managerOptions.find((option) => String(option.id) === nextManagerId);

    setManagerId(nextManagerId);
    setManagerCompanyId(selectedManager?.companyId ? String(selectedManager.companyId) : "");
  }

  function validateForm() {
    if (!name.trim()) {
      return "회사명을 입력해주세요.";
    }

    if (!telnum.trim()) {
      return "전화번호를 입력해주세요.";
    }

    if (!managerId) {
      return "고객 관리 파트너를 선택해주세요.";
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

    if (!window.confirm("고객을 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/customers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          telnum,
          managerId,
          managerCompanyId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "고객 수정에 실패했습니다.");
      }

      await router.push(`/customers/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/customer" title="고객 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">고객 정보를 불러오는 중입니다.</p> : null}
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
            <span className="form-label">고객 관리 파트너</span>
            <select className="form-control" value={managerId} onChange={handleManagerChange} disabled={isLoading}>
              <option value="">담당자 선택</option>
              {managerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/customers/${id}` : "/customer"} legacyBehavior>
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
