import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { NoticeTable } from "@/features/notice/components/notice-table";
import { getAuthToken, getRole } from "@/lib/auth";

export function NoticeManagementPage() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchNotices({
      searchType: "title",
      keyword: "",
      page: 1,
    });
  }, []);

  async function fetchNotices(nextQuery) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("searchType", nextQuery.searchType);
    params.set("page", String(nextQuery.page || 1));
    params.set("limit", String(pagination.limit));

    if (nextQuery.keyword) {
      params.set("keyword", nextQuery.keyword);
    }

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/notices?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("공지사항 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setNotices(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setNotices([]);
      setPagination((current) => ({
        ...current,
        total: 0,
      }));
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void fetchNotices({
      searchType,
      keyword,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("title");
    setKeyword("");
    void fetchNotices({
      searchType: "title",
      keyword: "",
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchNotices({
      searchType,
      keyword,
      page: nextPage,
    });
  }

  return (
    <AdminLayout
      activePath="/notice"
      title="공지사항 관리"
      actions={
        getRole() === "admin" ? (
          <Link href="/notices/create" legacyBehavior>
            <a className="primary-button">공지사항 등록</a>
          </Link>
        ) : null
      }
    >
      <section className="toolbar toolbar-business">
        <div className="toolbar-spacer" />

        <form className="search-bar" onSubmit={handleSubmit}>
          <select
            className="search-select"
            value={searchType}
            aria-label="검색 구분"
            onChange={(event) => {
              setSearchType(event.target.value);
              setKeyword("");
            }}
          >
            <option value="title">제목</option>
            <option value="writer">작성자</option>
            <option value="level">등급</option>
          </select>
          {searchType === "level" ? (
            <select
              className="search-input"
              aria-label="등급 선택"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            >
              <option value="">전체</option>
              <option value="ALL">ALL</option>
              <option value="PLATINUM">PLATINUM</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="VAR">VAR</option>
            </select>
          ) : (
            <input
              className="search-input"
              type="text"
              placeholder={searchType === "title" ? "제목 입력" : "검색어 입력"}
              aria-label="검색어 입력"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          )}
          <button className="action-button action-button-primary" type="submit">
            검색
          </button>
          <button className="action-button action-button-muted" type="button" onClick={handleReset}>
            초기화
          </button>
        </form>
      </section>

      <NoticeTable
        notices={notices}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
