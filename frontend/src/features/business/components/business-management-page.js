import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { BusinessTable } from "@/features/business/components/business-table";
import { getAuthToken } from "@/lib/auth";

export function BusinessManagementPage() {
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("business");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchBusinesses({
      searchType: "business",
      keyword: "",
      page: 1,
    });
  }, []);

  async function fetchBusinesses(nextQuery) {
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

      const response = await fetch(`${apiBaseUrl}/businesses?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사업 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setBusinesses(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setBusinesses([]);
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
    void fetchBusinesses({
      searchType,
      keyword,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("business");
    setKeyword("");
    void fetchBusinesses({
      searchType: "business",
      keyword: "",
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchBusinesses({
      searchType,
      keyword,
      page: nextPage,
    });
  }

  return (
    <AdminLayout
      activePath="/business"
      title="사업 관리"
      actions={
        <Link href="/businesses/create" legacyBehavior>
          <a className="primary-button">사업 등록</a>
        </Link>
      }
    >
      <section className="toolbar toolbar-business">
        <div className="toolbar-spacer" />

        <form className="search-bar" onSubmit={handleSubmit}>
          <select
            className="search-select"
            value={searchType}
            aria-label="검색 구분"
            onChange={(event) => setSearchType(event.target.value)}
          >
            <option value="business">사업</option>
            <option value="managerCompany">담당자회사</option>
            <option value="customer">고객회사</option>
            <option value="status">상태</option>
          </select>
          {searchType === "status" ? (
            <select
              className="search-input"
              aria-label="상태 선택"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            >
              <option value="">상태 선택</option>
              <option value="standby">대기 중</option>
              <option value="meeting">고객 미팅</option>
              <option value="poc">PoC</option>
              <option value="bmt">BMT</option>
              <option value="ordering">발주</option>
              <option value="proposal">제안</option>
              <option value="ordersuccess">수주 성공</option>
              <option value="cancel">취소</option>
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

      <BusinessTable
        businesses={businesses}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
