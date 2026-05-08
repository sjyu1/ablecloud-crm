import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      <p className="detail-value">{value || "-"}</p>
    </div>
  );
}

export function UserDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const canChangePassword = user ? String(user.type || "").toLowerCase() !== "customer" : false;

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchUserDetail(String(id));
  }, [router.isReady, id]);

  useEffect(() => {
    if (!canChangePassword && isPasswordModalOpen) {
      closePasswordModal();
    }
  }, [canChangePassword, isPasswordModalOpen]);

  async function fetchUserDetail(userId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");
    setPasswordError("");
    setPasswordMessage("");

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
        throw new Error("사용자 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setUser(data);
    } catch (fetchError) {
      setUser(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function openPasswordModal() {
    setPassword("");
    setPasswordConfirm("");
    setPasswordError("");
    setPasswordMessage("");
    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setPassword("");
    setPasswordConfirm("");
    setPasswordError("");
    setPasswordMessage("");
  }

  function validatePasswordForm() {
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

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    const validationMessage = validatePasswordForm();

    if (validationMessage) {
      setPasswordError(validationMessage);
      setPasswordMessage("");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setPasswordError("로그인이 필요합니다.");
      setPasswordMessage("");
      return;
    }

    if (!window.confirm("비밀번호를 변경하시겠습니까?")) {
      return;
    }

    setPasswordError("");
    setPasswordMessage("");
    setIsSubmittingPassword(true);

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
      setPasswordMessage(data.message || "비밀번호가 변경되었습니다.");
      setTimeout(() => {
        closePasswordModal();
      }, 600);
    } catch (submitError) {
      setPasswordError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
      setPasswordMessage("");
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  async function handleDelete() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("이 사용자를 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "사용자 삭제에 실패했습니다.");
      }

      await router.push("/user");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AdminLayout
      activePath="/user"
      title="사용자 상세정보"
      actions={
        <div className="page-actions">
          {canChangePassword ? (
            <button className="action-square-button" type="button" onClick={openPasswordModal}>
              비밀번호 변경
            </button>
          ) : null}
          <Link href={id ? `/users/${encodeURIComponent(String(id))}/edit` : "#"} legacyBehavior>
            <a className="action-square-button">수정</a>
          </Link>
          <button className="action-square-button action-square-button-danger" type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
          <Link href="/user" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">사용자 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && user ? (
          <div className="detail-grid">
            <DetailField label="아이디" value={user.id} />
            <DetailField label="이메일" value={user.email} />
            <DetailField label="이름" value={user.name} />
            <DetailField label="권한" value={user.role} />
            <DetailField label="사용자 구분" value={user.type} />
            <DetailField label="회사" value={user.company} />
            <DetailField label="전화번호" value={user.telnum} />
          </div>
        ) : null}
      </section>
      {canChangePassword && isPasswordModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closePasswordModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-password-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="user-password-modal-title" className="detail-section-title">
              비밀번호 변경
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="license-create-grid">
                <label className="form-field">
                  <span className="form-label">새 비밀번호</span>
                  <input
                    className="form-control"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
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
              {passwordError ? <p className="form-feedback form-feedback-error">{passwordError}</p> : null}
              {passwordMessage ? <p className="form-feedback">{passwordMessage}</p> : null}
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={closePasswordModal}>
                  취소
                </button>
                <button className="primary-button" type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
