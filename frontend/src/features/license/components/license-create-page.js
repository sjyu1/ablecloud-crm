import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

export function LicenseCreatePage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    void fetchBusinesses();
  }, []);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => String(business.id) === selectedBusinessId),
    [businesses, selectedBusinessId]
  );

  async function fetchBusinesses() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(
        `${apiBaseUrl}/businesses?searchType=business&page=1&limit=100&available=true`,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("사업 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      const sortedBusinesses = [...(data.items || [])].sort((left, right) =>
        left.project.localeCompare(right.project, "ko")
      );
      setBusinesses(sortedBusinesses);
    } catch (fetchError) {
      setBusinesses([]);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBusinessChange(event) {
    setSelectedBusinessId(event.target.value);
    setSubmitMessage("");
  }

  function validateDates() {
    if (!startDate) {
      return "시작일을 입력해주세요.";
    }

    if (!isPermanent && !isTrial && !endDate) {
      return "만료일을 입력해주세요.";
    }

    if (endDate && startDate > endDate) {
      return "만료일은 시작일보다 빠를 수 없습니다.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitMessage("");

    if (!selectedBusinessId) {
      setError("사업을 선택해주세요.");
      return;
    }

    const dateValidationMessage = validateDates();

    if (dateValidationMessage) {
      setError(dateValidationMessage);
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("라이선스를 등록하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/licenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          startDate,
          endDate,
          isPermanent,
          isTrial,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "라이선스 생성에 실패했습니다.");
      }

      setSubmitMessage(data.message || "라이선스가 생성되었습니다.");
      await router.push(`/licenses/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout
      activePath="/"
      title="라이선스 생성"
      actions={null}
    >
      <form className="license-create-card" onSubmit={handleSubmit}>
        <div className="license-create-grid">
          <label className="form-field">
            <span className="form-label">사업</span>
            <select
              className="form-control"
              value={selectedBusinessId}
              onChange={handleBusinessChange}
              disabled={isLoading}
            >
              <option value="">선택하세요</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.project}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">제품</span>
            <input
              className="form-control"
              type="text"
              value={selectedBusiness?.product || ""}
              placeholder="사업을 선택하세요"
              readOnly
            />
          </label>

          <label className="form-field">
            <span className="form-label">시작일</span>
            <input
              className="form-control"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setSubmitMessage("");
              }}
            />
          </label>

          <label className="form-field">
            <span className="form-label">만료일</span>
            <input
              className="form-control"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setSubmitMessage("");
              }}
              disabled={isPermanent}
            />
          </label>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(event) => {
                setIsPermanent(event.target.checked);
                if (event.target.checked) {
                  setEndDate("");
                }
              }}
            />
            <span>영구 라이선스</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isTrial}
              onChange={(event) => setIsTrial(event.target.checked)}
            />
            <span>Trial (Trial 라이선스는 시작일부터 한달 사용가능합니다.)</span>
          </label>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
        {submitMessage ? <p className="form-feedback">{submitMessage}</p> : null}

        <div className="form-actions">
          <Link href="/" legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "생성"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
