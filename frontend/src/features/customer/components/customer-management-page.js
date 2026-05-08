import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { CustomerTable } from "@/features/customer/components/customer-table";
import { getAuthToken } from "@/lib/auth";

export function CustomerManagementPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("customer");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
      void fetchCustomers({
      searchType: "customer",
      keyword: "",
      page: 1,
    });
  }, []);

  async function fetchCustomers(nextQuery) {
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

      const response = await fetch(`${apiBaseUrl}/customers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("고객 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setCustomers(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setCustomers([]);
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
    void fetchCustomers({
      searchType,
      keyword,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("customer");
    setKeyword("");
    void fetchCustomers({
      searchType: "customer",
      keyword: "",
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchCustomers({
      searchType,
      keyword,
      page: nextPage,
    });
  }

  return (
    <AdminLayout
      activePath="/customer"
      title="고객 관리"
      actions={
        <Link href="/customers/create" legacyBehavior>
          <a className="primary-button">고객 등록</a>
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
            <option value="customer">고객</option>
            <option value="managerCompany">고객관리 파트너 회사</option>
          </select>
          <input
            className="search-input"
            type="text"
            placeholder={searchType === "managerCompany" ? "고객관리 파트너 회사 입력" : "고객 입력"}
            aria-label="검색어 입력"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button className="action-button action-button-primary" type="submit">
            검색
          </button>
          <button className="action-button action-button-muted" type="button" onClick={handleReset}>
            초기화
          </button>
        </form>
      </section>

      <CustomerTable
        customers={customers}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
