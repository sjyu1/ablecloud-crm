import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

function sortOptions(options) {
  return [...options].sort((left, right) =>
    String(left.label || "").localeCompare(String(right.label || ""), "ko")
  );
}

export function CreditEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [creditItem, setCreditItem] = useState(null);
  const [partnerId, setPartnerId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [deposit, setDeposit] = useState("");
  const [credit, setCredit] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchCreditDetail(String(id));
  }, [router.isReady, id]);

  async function fetchCreditDetail(creditId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/credits/${creditId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("크레딧 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      const nextCredit = {
        ...data,
        partnerOptions: sortOptions(data.partnerOptions || []),
        businessOptions: data.businessOptions || [],
      };

      setCreditItem(nextCredit);
      setPartnerId(String(data.partnerId || ""));
      setBusinessId(String(data.businessId || ""));
      setDeposit(data.deposit === null || data.deposit === undefined ? "" : String(data.deposit));
      setCredit(data.credit === null || data.credit === undefined ? "" : String(data.credit));
      setNote(data.note || "");
    } catch (fetchError) {
      setCreditItem(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    if (!partnerId) {
      return "파트너를 선택해주세요.";
    }

    if (!deposit && !credit) {
      return "구매 크레딧 또는 사용 크레딧을 입력해주세요.";
    }

    if (deposit && (Number(deposit) < 0 || Number.isNaN(Number(deposit)) || !Number.isInteger(Number(deposit)))) {
      return "구매 크레딧은 0 이상의 정수여야 합니다.";
    }

    if (credit && (Number(credit) < 0 || Number.isNaN(Number(credit)) || !Number.isInteger(Number(credit)))) {
      return "사용 크레딧은 0 이상의 정수여야 합니다.";
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

    if (!window.confirm("크레딧 정보를 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/credits/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          partnerId,
          businessId,
          deposit,
          credit,
          note,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "크레딧 수정에 실패했습니다.");
      }

      await router.push(`/credits/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/credit" title="크레딧 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">크레딧 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && creditItem ? (
          <div className="license-create-grid credit-form-grid">
            <label className="form-field">
              <span className="form-label">파트너</span>
              <select className="form-control" value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>
                <option value="">선택하세요</option>
                {(creditItem.partnerOptions || []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">사업</span>
              <select className="form-control" value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
                <option value="">선택 안 함</option>
                {(creditItem.businessOptions || []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">구매 크레딧</span>
              <input className="form-control" type="number" min="0" step="1" value={deposit} onChange={(event) => setDeposit(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">사용 크레딧</span>
              <input className="form-control" type="number" min="0" step="1" value={credit} onChange={(event) => setCredit(event.target.value)} />
            </label>

            <label className="form-field credit-wide-field">
              <span className="form-label">메모</span>
              <textarea className="detail-textarea detail-textarea-edit" value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/credits/${id}` : "/credit"} legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting || !creditItem}>
            {isSubmitting ? "수정 중..." : "수정"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
