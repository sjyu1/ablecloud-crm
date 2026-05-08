import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { LicenseTable } from "@/features/license/components/license-table";
import { getAuthToken } from "@/lib/auth";

export function LicenseManagementPage() {
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("normal");
  const [searchType, setSearchType] = useState("business_name");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchLicenses({
      searchType,
      keyword,
      trial: activeTab,
      page: 1,
    });
  }, [activeTab]);

  async function fetchLicenses(nextQuery) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    const params = new URLSearchParams();

    params.set("searchType", nextQuery.searchType);

    if (nextQuery.keyword) {
      params.set("keyword", nextQuery.keyword);
    }

    if (nextQuery.trial === "trial") {
      params.set("trial", "trial");
    }

    params.set("page", String(nextQuery.page || 1));
    params.set("limit", String(pagination.limit));

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/licenses?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("라이선스 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setLicenses(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setLicenses([]);
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
    void fetchLicenses({
      searchType,
      keyword,
      trial: activeTab,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("business_name");
    setKeyword("");
    void fetchLicenses({
      searchType: "business_name",
      keyword: "",
      trial: activeTab,
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchLicenses({
      searchType,
      keyword,
      trial: activeTab,
      page: nextPage,
    });
  }

  return (
    <AdminLayout
      activePath="/"
      title="라이선스 관리"
      actions={
        <Link href="/licenses/create" legacyBehavior>
          <a className="primary-button">라이선스 생성</a>
        </Link>
      }
    >
      <section className="toolbar">
        <div className="tabs" aria-label="라이선스 상태">
          <button
            className={activeTab === "normal" ? "tab is-active" : "tab"}
            type="button"
            onClick={() => setActiveTab("normal")}
          >
            일반
          </button>
          <button
            className={activeTab === "trial" ? "tab is-active" : "tab"}
            type="button"
            onClick={() => setActiveTab("trial")}
          >
            TRIAL
          </button>
        </div>

        <form className="search-bar" onSubmit={handleSubmit}>
          <select
            className="search-select"
            value={searchType}
            aria-label="검색 구분"
            onChange={(event) => setSearchType(event.target.value)}
          >
            <option value="business_name">사업</option>
            <option value="license_key">라이선스키</option>
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
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
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

      <LicenseTable
        error={error}
        isLoading={isLoading}
        licenses={licenses}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
