import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { SupportTable } from "@/features/support/components/support-table";
import { supportStatusOptions, supportTypeOptions } from "@/features/support/support-options";
import { getAuthToken, getRole } from "@/lib/auth";

export function SupportManagementPage() {
  const [supports, setSupports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("issue");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchSupports({
      searchType: "issue",
      keyword: "",
      page: 1,
    });
  }, []);

  async function fetchSupports(nextQuery) {
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

      const response = await fetch(`${apiBaseUrl}/supports?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("기술지원 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setSupports(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setSupports([]);
      setPagination((current) => ({
        ...current,
        total: 0,
      }));
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearchTypeChange(event) {
    setSearchType(event.target.value);
    setKeyword("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    void fetchSupports({
      searchType,
      keyword,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("issue");
    setKeyword("");
    void fetchSupports({
      searchType: "issue",
      keyword: "",
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchSupports({
      searchType,
      keyword,
      page: nextPage,
    });
  }

  return (
    <AdminLayout
      activePath="/support"
      title="기술지원 관리"
      actions={
        getRole() === "admin" ? (
          <Link href="/supports/create" legacyBehavior>
            <a className="primary-button">기술지원 등록</a>
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
            onChange={handleSearchTypeChange}
          >
            {/* <option value="issue">문의내용</option> */}
            <option value="customer">고객회사</option>
            <option value="business">사업</option>
            {/* <option value="requester">요청자</option> */}
            <option value="manager">담당자</option>
            <option value="status">상태</option>
            <option value="type">유형</option>
          </select>
          {searchType === "status" ? (
            <select
              className="search-input"
              aria-label="상태 선택"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            >
              <option value="">상태 선택</option>
              {supportStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : searchType === "type" ? (
            <select
              className="search-input"
              aria-label="유형 선택"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            >
              <option value="">유형 선택</option>
              {supportTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="search-input"
              type="text"
              placeholder="검색어 입력"
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

      <SupportTable
        supports={supports}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
