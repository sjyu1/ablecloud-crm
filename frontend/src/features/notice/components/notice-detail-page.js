import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken, getRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";

function DetailField({ label, value, isTextarea = false }) {
  return (
    <div className="detail-field">
      <p className="detail-label">{label}</p>
      {isTextarea ? (
        <textarea className="detail-textarea notice-content-textarea" value={value || ""} readOnly />
      ) : (
        <p className="detail-value">{value || "-"}</p>
      )}
    </div>
  );
}

export function NoticeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [notice, setNotice] = useState(null);
  const [mailTargets, setMailTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMailTargetModalOpen, setIsMailTargetModalOpen] = useState(false);
  const [isLoadingMailTargets, setIsLoadingMailTargets] = useState(false);
  const [error, setError] = useState("");
  const [mailTargetError, setMailTargetError] = useState("");
  const [selectedTargets, setSelectedTargets] = useState([]);

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
        throw new Error("공지사항 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setNotice(data);
    } catch (fetchError) {
      setNotice(null);
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function openMailTargetModal() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsMailTargetModalOpen(true);
    setIsLoadingMailTargets(true);
    setMailTargetError("");
    setMailTargets([]);
    setSelectedTargets([]);

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/notices/${id}/mail-targets`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("메일 대상 파트너/벤더 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setMailTargets(data.items || []);
    } catch (fetchError) {
      setMailTargetError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoadingMailTargets(false);
    }
  }

  function closeMailTargetModal() {
    setIsMailTargetModalOpen(false);
    setMailTargetError("");
  }

  async function handleDelete() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/notices/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "공지사항 삭제에 실패했습니다.");
      }

      await router.push("/notice");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleTarget(target) {
    setSelectedTargets((prev) => {
      if (prev.includes(target.id)) {
        return prev.filter((id) => id !== target.id);
      }
      return [...prev, target.id];
    });
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelectedTargets([]);
    } else {
      setSelectedTargets(mailTargets.map((t) => t.id));
    }
  }

  const isAllSelected =
    mailTargets.length > 0 &&
    mailTargets.every((t) => selectedTargets.includes(t.id));

  async function handleSendMail() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    try {
      const response = await fetch(`${apiBaseUrl}/notices/${id}/send-mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userIds: selectedTargets,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "메일 발송 실패");
      }

      alert("메일이 발송되었습니다.");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <AdminLayout
      activePath="/notice"
      title="공지사항 상세정보"
      actions={
        <div className="page-actions">
          {getRole() === "admin" ? (
            <>
              <Link href={id ? `/notices/${id}/edit` : "#"} legacyBehavior>
                <a className="action-square-button">수정</a>
              </Link>
              <button className="action-square-button" type="button" onClick={openMailTargetModal}>
                파트너/벤더에게 메일보내기
              </button>
              <button
                className="action-square-button action-square-button-danger"
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중" : "삭제"}
              </button>
            </>
          ) : null}
          <Link href="/notice" legacyBehavior>
            <a className="action-square-button">목록</a>
          </Link>
        </div>
      }
    >
      <section className="detail-card">
        {isLoading ? <p className="detail-feedback">공지사항 상세 정보를 불러오는 중입니다.</p> : null}
        {!isLoading && error ? <p className="detail-feedback detail-feedback-error">{error}</p> : null}
        {!isLoading && !error && notice ? (
          <div className="detail-grid">
            <DetailField label="제목" value={notice.title} />
            <DetailField label="작성자" value={notice.writer} />
            <DetailField label="등급" value={notice.level} />
            <DetailField label="등록일" value={formatDateTime(notice.createdAt)} />
            <DetailField label="수정일" value={formatDateTime(notice.updatedAt)} />
            <DetailField label="내용" value={notice.content} isTextarea />
          </div>
        ) : null}
      </section>
      {isMailTargetModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeMailTargetModal}>
          <div
            className="modal-card notice-mail-target-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-mail-target-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="notice-mail-target-modal-title" className="detail-section-title">
              메일 대상 파트너/벤더 (총 {mailTargets.length}명)
            </h2>
            {isLoadingMailTargets ? <p className="detail-feedback">메일 대상 파트너/벤더를 불러오는 중입니다.</p> : null}
            {!isLoadingMailTargets && mailTargetError ? <p className="detail-feedback detail-feedback-error">{mailTargetError}</p> : null}
            {!isLoadingMailTargets && !mailTargetError ? (
              mailTargets.length > 0 ? (
                <div className="table-scroll">
                  <table className="license-table notice-mail-target-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            onChange={toggleAll}
                            checked={isAllSelected}
                          />
                        </th>
                        <th>파트너/벤더</th>
                        <th>등급</th>
                        <th>아이디</th>
                        <th>이름</th>
                        <th>이메일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mailTargets.map((target) => {
                        const isChecked = selectedTargets.includes(target.id);

                        return (
                          <tr key={target.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleTarget(target)}
                              />
                            </td>
                            <td>{target.partner || "-"}</td>
                            <td>{target.level || "-"}</td>
                            <td>{target.id || "-"}</td>
                            <td>{target.name || "-"}</td>
                            <td>{target.email || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="detail-feedback">메일 대상 파트너/벤더 사용자가 없습니다.</p>
              )
            ) : null}
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeMailTargetModal}>
                닫기
              </button>
              <button
                className="primary-button"
                onClick={handleSendMail}
                disabled={selectedTargets.length === 0}
              >
                메일 전송
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
