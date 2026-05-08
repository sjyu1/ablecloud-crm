import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { CreditTable } from "@/features/credit/components/credit-table";
import { getAuthToken } from "@/lib/auth";

export function CreditManagementPage() {
  const [credits, setCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("category");
  const [keyword, setKeyword] = useState("");
  const [creditKind, setCreditKind] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchCredits({
      searchType: "category",
      keyword: "",
      kind: "all",
      page: 1,
    });
  }, []);

  async function fetchCredits(nextQuery) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("searchType", nextQuery.searchType);
    params.set("page", String(nextQuery.page || 1));
    params.set("limit", String(pagination.limit));

    if (nextQuery.searchType === "category" && nextQuery.kind && nextQuery.kind !== "all") {
      params.set("kind", nextQuery.kind);
    }

    if (nextQuery.searchType !== "category" && nextQuery.keyword) {
      params.set("keyword", nextQuery.keyword);
    }

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/credits?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("크레딧 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setCredits(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setCredits([]);
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
    void fetchCredits({
      searchType,
      keyword,
      kind: creditKind,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("category");
    setKeyword("");
    setCreditKind("all");
    void fetchCredits({
      searchType: "category",
      keyword: "",
      kind: "all",
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchCredits({
      searchType,
      keyword,
      kind: creditKind,
      page: nextPage,
    });
  }

  function handleSearchTypeChange(event) {
    setSearchType(event.target.value);
    setKeyword("");
    setCreditKind("all");
  }

  return (
    <AdminLayout
      activePath="/credit"
      title="크레딧 관리"
      actions={
        <Link href="/credits/create" legacyBehavior>
          <a className="primary-button">크레딧 등록</a>
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
            onChange={handleSearchTypeChange}
          >
            <option value="category">구분</option>
            <option value="partner">파트너</option>
            <option value="business">사업</option>
          </select>
          {searchType === "category" ? (
            <select
              className="search-input"
              aria-label="구분 선택"
              value={creditKind}
              onChange={(event) => setCreditKind(event.target.value)}
            >
              <option value="all">구분 전체</option>
              <option value="purchase">구매 크레딧</option>
              <option value="use">사용 크레딧</option>
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

      <CreditTable
        credits={credits}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
