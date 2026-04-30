import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { noticeLevelOptions } from "@/features/notice/notice-options";
import { getAuthToken } from "@/lib/auth";

function parseLevels(value) {
  const levels = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (levels.includes("ALL")) {
    return noticeLevelOptions.map((option) => option.value);
  }

  return levels;
}

export function NoticeEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [notice, setNotice] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [writer, setWriter] = useState("");
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    void fetchNoticeDetail(String(id));
  }, [router.isReady, id]);

  async function fetchNoticeDetail(noticeId) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/notices/${noticeId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("공지사항 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setNotice(data);
      setTitle(data.title || "");
      setContent(data.content || "");
      setWriter(data.writer || "");
      setLevels(parseLevels(data.level));
    } catch (fetchError) {
      setNotice(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

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

    if (!window.confirm("공지사항 정보를 수정하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/notices/${id}`, {
        method: "PATCH",
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
        throw new Error(data.message || "공지사항 수정에 실패했습니다.");
      }

      await router.push(`/notices/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout activePath="/notice" title="공지사항 수정" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">공지사항 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && notice ? (
          <div className="license-create-grid notice-form-grid">
            <label className="form-field">
              <span className="form-label">제목</span>
              <input className="form-control" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">작성자</span>
              <input className="form-control" type="text" value={writer} readOnly />
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
        ) : null}

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href={id ? `/notices/${id}` : "/notice"} legacyBehavior>
            <a className="secondary-button">취소</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting || !notice}>
            {isSubmitting ? "수정 중..." : "수정"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
