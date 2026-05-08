import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

export function LicenseEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [license, setLicense] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        throw new Error("라이선스 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setLicense(data);
      setStartDate(data.startDate || "");
      setEndDate(data.endDate || "");
      setIsPermanent(Boolean(data.isPermanent));
      setIsTrial(Boolean(data.trial));
    } catch (fetchError) {
      setLicense(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function validateDates() {
    if (!startDate) {
      return "시작일을 입력해주세요.";
    }

    if (!isPermanent && !isTrial && !endDate) {
      return "시작일과 만료일을 입력해주세요.";
    }

    if (endDate && startDate > endDate) {
      return "만료일은 시작일보다 빠를 수 없습니다.";
    }

    return "";
  }

  function getTrialEndDate(nextStartDate) {
    if (!nextStartDate) {
      return "";
    }

    const date = new Date(`${nextStartDate}T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + 1);
    return date.toISOString().slice(0, 10);
  }

  async function handleSubmit(event) {
    event.preventDefault();

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

    if (!window.confirm("라이선스를 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/licenses/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          isPermanent,
          isTrial,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "라이선스 수정에 실패했습니다.");
      }

      await router.push(`/licenses/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/" title="라이선스 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">라이선스 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && !error && license ? (
          <>
            <div className="license-create-grid">
              <label className="form-field">
                <span className="form-label">라이선스 키</span>
                <input className="form-control" type="text" value={license.key || ""} readOnly />
              </label>

              <label className="form-field">
                <span className="form-label">제품</span>
                <input className="form-control" type="text" value={license.product || ""} readOnly />
              </label>

              <label className="form-field">
                <span className="form-label">사업</span>
                <input className="form-control" type="text" value={license.project || ""} readOnly />
              </label>

              <label className="form-field">
                <span className="form-label">시작일</span>
                <input
                  className="form-control"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    const nextStartDate = event.target.value;
                    setStartDate(nextStartDate);

                    if (isTrial) {
                      setEndDate(getTrialEndDate(nextStartDate));
                    }
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
                  onChange={(event) => setEndDate(event.target.value)}
                  disabled={isPermanent || isTrial}
                />
              </label>
            </div>

            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPermanent}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setIsPermanent(nextValue);

                    if (nextValue) {
                      setIsTrial(false);
                      setEndDate("9999-12-31");
                      return;
                    }

                    if (endDate === "9999-12-31") {
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
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setIsTrial(nextValue);

                    if (nextValue) {
                      setIsPermanent(false);
                      setEndDate(getTrialEndDate(startDate));
                    }
                  }}
                />
                <span>Trial (Trial 라이선스는 시작일부터 한달 사용가능합니다.)</span>
              </label>
            </div>
          </>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/licenses/${id}` : "/"} legacyBehavior>
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
