import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { noticeLevelOptions } from "@/features/notice/notice-options";
import { getAuthToken } from "@/lib/auth";

export function NoticeCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleLevelChange(value) {
    setLevels((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function validateForm() {
    if (!title.trim()) {
      return "제목을 입력해주세요.";
    }

    if (!content.trim()) {
      return "내용을 입력해주세요.";
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

    if (!window.confirm("공지사항을 등록하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/notices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title,
          content,
          level: levels,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "공지사항 등록에 실패했습니다.");
      }

      await router.push(`/notices/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/notice" title="공지사항 등록" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        <div className="license-create-grid notice-form-grid">
          <label className="form-field">
            <span className="form-label">제목</span>
            <input className="form-control" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <div className="form-field notice-wide-field">
            <span className="form-label">등급</span>
            <div className="partner-category-box">
              {noticeLevelOptions.map((option) => (
                <label className="partner-category-option" key={option.value}>
                  <input
                    type="checkbox"
                    checked={levels.includes(option.value)}
                    onChange={() => handleLevelChange(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="form-field notice-wide-field">
            <span className="form-label">내용</span>
            <textarea className="detail-textarea detail-textarea-edit notice-content-textarea" value={content} onChange={(event) => setContent(event.target.value)} />
          </label>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href="/notice" legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
