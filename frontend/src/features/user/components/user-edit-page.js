import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

export function UserEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telnum, setTelnum] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchUserDetail(String(id));
  }, [router.isReady, id]);

  async function fetchUserDetail(userId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(userId)}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사용자 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setName(data.name === "-" ? "" : data.name || "");
      setEmail(data.email === "-" ? "" : data.email || "");
      setTelnum(data.telnum === "-" ? "" : data.telnum || "");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    if (!name.trim()) {
      return "이름을 입력해주세요.";
    }

    if (!email.trim()) {
      return "이메일을 입력해주세요.";
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

    if (!window.confirm("사용자를 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          email,
          telnum,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "사용자 수정에 실패했습니다.");
      }

      await router.push(`/users/${encodeURIComponent(String(id))}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/user" title="사용자 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">사용자 정보를 불러오는 중입니다.</p> : null}
        <div className="license-create-grid">
          <label className="form-field">
            <span className="form-label">이름</span>
            <input className="form-control" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-label">이메일</span>
            <input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-label">전화번호</span>
            <input className="form-control" type="text" value={telnum} onChange={(event) => setTelnum(event.target.value)} />
          </label>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/users/${encodeURIComponent(String(id))}` : "/user"} legacyBehavior>
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
