import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import {
  supportActionTypeOptions,
  supportStatusOptions,
  supportTypeOptions,
} from "@/features/support/support-options";
import { getAuthToken, getUsername } from "@/lib/auth";

function sortOptions(options) {
  return [...options].sort((left, right) =>
    String(left.label || "").localeCompare(String(right.label || ""), "ko")
  );
}

export function SupportCreatePage() {
  const router = useRouter();
  const [formOptions, setFormOptions] = useState({
    customerOptions: [],
    businessOptions: [],
  });
  const [customerId, setCustomerId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [issued, setIssued] = useState("");
  const [type, setType] = useState("consult");
  const [issue, setIssue] = useState("");
  const [solution, setSolution] = useState("");
  const [actioned, setActioned] = useState("");
  const [actionType, setActionType] = useState("phone");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState("processing");
  const [requester, setRequester] = useState("");
  const [requesterTelnum, setRequesterTelnum] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [writer, setWriter] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setWriter(getUsername() || "");
    void fetchFormOptions();
  }, []);

  const filteredBusinessOptions = useMemo(
    () =>
      formOptions.businessOptions.filter(
        (option) => !customerId || String(option.customerId) === String(customerId)
      ),
    [formOptions.businessOptions, customerId]
  );

  async function fetchFormOptions() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/supports/meta/options`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("기술지원 등록 옵션을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setFormOptions({
        customerOptions: sortOptions(data.customerOptions || []),
        businessOptions: data.businessOptions || [],
      });
    } catch (fetchError) {
      setFormOptions({
        customerOptions: [],
        businessOptions: [],
      });
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCustomerChange(event) {
    const nextCustomerId = event.target.value;

    setCustomerId(nextCustomerId);

    if (
      businessId &&
      !formOptions.businessOptions.some(
        (option) =>
          String(option.id) === String(businessId) &&
          String(option.customerId) === String(nextCustomerId)
      )
    ) {
      setBusinessId("");
    }
  }

  function validateForm() {
    if (!customerId) {
      return "고객회사를 선택해주세요.";
    }

    if (!issued) {
      return "접수일을 입력해주세요.";
    }

    if (actioned && actioned < issued) {
      return "처리일은 접수일보다 빠를 수 없습니다.";
    }

    if (!issue.trim()) {
      return "문의내용을 입력해주세요.";
    }

    if (requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      return "요청자 이메일 형식이 올바르지 않습니다.";
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

    if (!window.confirm("기술지원을 등록하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/supports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customerId,
          businessId,
          issued,
          type,
          issue,
          solution,
          actioned,
          actionType,
          manager,
          status,
          requester,
          requesterTelnum,
          requesterEmail,
          writer,
          note,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "기술지원 등록에 실패했습니다.");
      }

      await router.push(`/supports/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/support" title="기술지원 등록" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">기술지원 등록 옵션을 불러오는 중입니다.</p> : null}
        {!isLoading ? (
          <div className="license-create-grid support-form-grid">
            <label className="form-field">
              <span className="form-label">고객회사</span>
              <select className="form-control" value={customerId} onChange={handleCustomerChange}>
                <option value="">선택하세요</option>
                {formOptions.customerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">사업</span>
              <select
                className="form-control"
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
                disabled={!customerId}
              >
                <option value="">선택 안 함</option>
                {filteredBusinessOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">접수일</span>
              <input className="form-control" type="date" value={issued} onChange={(event) => setIssued(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">지원 유형</span>
              <select className="form-control" value={type} onChange={(event) => setType(event.target.value)}>
                {supportTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">처리 상태</span>
              <select className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
                {supportStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">처리일</span>
              <input className="form-control" type="date" min={issued || undefined} value={actioned} onChange={(event) => setActioned(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">처리 방식</span>
              <select className="form-control" value={actionType} onChange={(event) => setActionType(event.target.value)}>
                {supportActionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">담당자</span>
              <input className="form-control" type="text" value={manager} onChange={(event) => setManager(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">요청자</span>
              <input className="form-control" type="text" value={requester} onChange={(event) => setRequester(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">요청자 전화번호</span>
              <input className="form-control" type="text" value={requesterTelnum} onChange={(event) => setRequesterTelnum(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">요청자 이메일</span>
              <input className="form-control" type="email" value={requesterEmail} onChange={(event) => setRequesterEmail(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">작성자</span>
              <input className="form-control" type="text" value={writer} onChange={(event) => setWriter(event.target.value)} />
            </label>

            <label className="form-field support-wide-field">
              <span className="form-label">문의내용</span>
              <textarea className="detail-textarea detail-textarea-edit" value={issue} onChange={(event) => setIssue(event.target.value)} />
            </label>

            <label className="form-field support-wide-field">
              <span className="form-label">처리내용</span>
              <textarea className="detail-textarea detail-textarea-edit" value={solution} onChange={(event) => setSolution(event.target.value)} />
            </label>

            <label className="form-field support-wide-field">
              <span className="form-label">메모</span>
              <textarea className="detail-textarea detail-textarea-edit" value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href="/support" legacyBehavior>
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
