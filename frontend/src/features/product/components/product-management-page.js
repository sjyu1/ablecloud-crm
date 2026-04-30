import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { ProductTable } from "@/features/product/components/product-table";
import { getAuthToken, getRole } from "@/lib/auth";

export function ProductManagementPage() {
  const isAdmin = getRole() === "admin";
  const [products, setProducts] = useState([]);
  const [includeAll, setIncludeAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchProducts({
      searchType: "name",
      keyword: "",
      page: 1,
      includeAll: false,
    });
  }, []);

  async function fetchProducts(nextQuery) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("searchType", nextQuery.searchType);
    params.set("page", String(nextQuery.page || 1));
    params.set("limit", String(pagination.limit));
    params.set("includeAll", isAdmin && nextQuery.includeAll ? "true" : "false");

    if (nextQuery.keyword) {
      params.set("keyword", nextQuery.keyword);
    }

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/products?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("제품 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setProducts(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setProducts([]);
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
    void fetchProducts({
      searchType,
      keyword,
      page: 1,
      includeAll: isAdmin && includeAll,
    });
  }

  function handleReset() {
    setSearchType("name");
    setKeyword("");
    setIncludeAll(false);
    void fetchProducts({
      searchType: "name",
      keyword: "",
      page: 1,
      includeAll: false,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchProducts({
      searchType,
      keyword,
      page: nextPage,
      includeAll: isAdmin && includeAll,
    });
  }

  function handleIncludeAllChange(event) {
    const nextValue = event.target.checked;
    setIncludeAll(nextValue);
    void fetchProducts({
      searchType,
      keyword,
      page: 1,
      includeAll: isAdmin && nextValue,
    });
  }

  return (
    <AdminLayout
      activePath="/product"
      title="제품 관리"
      actions={
        isAdmin ? (
          <Link href="/products/create" legacyBehavior>
            <a className="primary-button">제품 등록</a>
          </Link>
        ) : null
      }
    >
      <section className="toolbar toolbar-product">
        {isAdmin ? (
          <label className="checkbox-label product-checkbox">
            <input type="checkbox" checked={includeAll} onChange={handleIncludeAllChange} />
            <span>제품 모두보기</span>
          </label>
        ) : null}
        <div className="toolbar-spacer" />

        <form className="search-bar" onSubmit={handleSubmit}>
          <select
            className="search-select"
            value={searchType}
            aria-label="검색 구분"
            onChange={(event) => setSearchType(event.target.value)}
          >
            <option value="name">제품명</option>
          </select>
          <input
            className="search-input"
            type="text"
            placeholder="제품명 입력"
            aria-label="제품명 입력"
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

      <ProductTable
        products={products}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
