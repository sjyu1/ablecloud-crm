import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

export function UserPasswordPage() {
  const router = useRouter();
  const { id } = router.query;
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    if (!password) {
      return "비밀번호를 입력해주세요.";
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      return "비밀번호는 8자 이상이며 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.";
    }

    if (password !== passwordConfirm) {
      return "비밀번호 확인이 일치하지 않습니다.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      setSuccessMessage("");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      setSuccessMessage("");
      return;
    }

    if (!window.confirm("비밀번호를 변경하시겠습니까?")) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(String(id))}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          password,
          passwordConfirm,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "비밀번호 변경에 실패했습니다.");
      }

      setPassword("");
      setPasswordConfirm("");
      setSuccessMessage(data.message || "비밀번호가 변경되었습니다.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/user" title="비밀번호 변경" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        <div className="license-create-grid">
          <label className="form-field">
            <span className="form-label">새 비밀번호</span>
            <input className="form-control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-label">비밀번호 확인</span>
            <input
              className="form-control"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
        {successMessage ? <p className="form-feedback">{successMessage}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/users/${encodeURIComponent(String(id))}` : "/user"} legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
