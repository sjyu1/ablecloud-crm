import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

function sortCustomerOptions(options) {
  return [...options].sort((left, right) =>
    String(left.label || "").localeCompare(String(right.label || ""), "ko")
  );
}

function sortManagerOptions(options) {
  return [...options].sort((left, right) =>
    String(left?.label || "").localeCompare(String(right?.label || ""), "ko")
  );
}

export function BusinessCreatePage() {
  const router = useRouter();
  const [formOptions, setFormOptions] = useState({
    managerOptions: [],
    customerOptions: [],
    productOptions: [],
  });
  const [project, setProject] = useState("");
  const [managerId, setManagerId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [nodeCount, setNodeCount] = useState("0");
  const [coreCount, setCoreCount] = useState("0");
  const [status, setStatus] = useState("standby");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [details, setDetails] = useState("");
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

      const response = await fetch(`${apiBaseUrl}/businesses/meta/options`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사업 등록 옵션을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setFormOptions({
        managerOptions: sortManagerOptions(data.managerOptions || []),
        customerOptions: sortCustomerOptions(data.customerOptions || []),
        productOptions: data.productOptions || [],
      });
    } catch (fetchError) {
      setFormOptions({
        managerOptions: [],
        customerOptions: [],
        productOptions: [],
      });
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    if (!project.trim()) {
      return "사업명을 입력해주세요.";
    }

    if (!managerId) {
      return "사업 담당자를 선택해주세요.";
    }

    if (!customerId) {
      return "고객회사를 선택해주세요.";
    }

    if (!productId) {
      return "제품을 선택해주세요.";
    }

    if (!startDate || !endDate) {
      return "사업 시작일과 종료일을 입력해주세요.";
    }

    if (startDate > endDate) {
      return "사업 종료일은 시작일보다 빠를 수 없습니다.";
    }

    if (Number(nodeCount) < 0 || Number.isNaN(Number(nodeCount))) {
      return "노드수는 0 이상이어야 합니다.";
    }

    if (Number(coreCount) < 0 || Number.isNaN(Number(coreCount))) {
      return "코어수는 0 이상이어야 합니다.";
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

    if (!window.confirm("사업을 등록하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/businesses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          project,
          managerId,
          customerId,
          productId,
          nodeCount,
          coreCount,
          status,
          startDate,
          endDate,
          details,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "사업 등록에 실패했습니다.");
      }

      await router.push(`/businesses/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/business" title="사업 등록" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">사업 등록 옵션을 불러오는 중입니다.</p> : null}
        {!isLoading ? (
          <div className="license-create-grid">
            <label className="form-field">
              <span className="form-label">사업</span>
              <input className="form-control" type="text" value={project} onChange={(event) => setProject(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">사업 담당자</span>
              <select className="form-control" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
                <option value="">선택하세요</option>
                {formOptions.managerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">고객회사</span>
              <select className="form-control" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">선택하세요</option>
                {formOptions.customerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">사업 상태</span>
              <select className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="standby">대기 중</option>
                <option value="meeting">고객 미팅</option>
                <option value="poc">PoC</option>
                <option value="bmt">BMT</option>
                <option value="ordering">발주</option>
                <option value="proposal">제안</option>
                <option value="ordersuccess">수주 성공</option>
                <option value="cancel">취소</option>
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">제품</span>
              <select className="form-control" value={productId} onChange={(event) => setProductId(event.target.value)}>
                <option value="">선택하세요</option>
                {formOptions.productOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">노드수</span>
              <input className="form-control" type="number" min="0" value={nodeCount} onChange={(event) => setNodeCount(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">코어수</span>
              <input className="form-control" type="number" min="0" value={coreCount} onChange={(event) => setCoreCount(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">사업 시작일</span>
              <input className="form-control" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">사업 종료일</span>
              <input className="form-control" type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>

            <label className="form-field business-details-field">
              <span className="form-label">세부사항</span>
              <textarea
                className="detail-textarea detail-textarea-edit"
                placeholder="내용을 입력하세요"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href="/business" legacyBehavior>
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
