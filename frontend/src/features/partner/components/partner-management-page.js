import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { PartnerTable } from "@/features/partner/components/partner-table";
import { getAuthToken, getRole } from "@/lib/auth";

const PARTNER_GRADES = ["PLATINUM", "GOLD", "SILVER", "VAR"];

export function PartnerManagementPage() {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeGrade, setActiveGrade] = useState("PLATINUM");
  const [searchType, setSearchType] = useState("company");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    void fetchPartners({
      searchType: "company",
      keyword: "",
      level: "PLATINUM",
      page: 1,
    });
  }, []);

  async function fetchPartners(nextQuery) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("searchType", nextQuery.searchType);
    params.set("page", String(nextQuery.page || 1));
    params.set("limit", String(pagination.limit));
    if (getRole() === "admin" && nextQuery.level) {
      params.set("level", nextQuery.level);
    }

    if (nextQuery.keyword) {
      params.set("keyword", nextQuery.keyword);
    }

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/partners?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("파트너 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setPartners(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setPartners([]);
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
    void fetchPartners({
      searchType,
      keyword,
      level: activeGrade,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("company");
    setKeyword("");
    setActiveGrade("PLATINUM");
    void fetchPartners({
      searchType: "company",
      keyword: "",
      level: "PLATINUM",
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }
    void fetchPartners({
      searchType,
      keyword,
      level: activeGrade,
      page: nextPage,
    });
  }

  function handleGradeChange(nextGrade) {
    setActiveGrade(nextGrade);
    void fetchPartners({
      searchType,
      keyword,
      level: nextGrade,
      page: 1,
    });
  }

  return (
    <AdminLayout
      activePath="/partner"
      title="파트너 관리"
      actions={
        getRole() === "admin" ? (
          <Link href="/partners/create" legacyBehavior>
            <a className="primary-button">파트너 등록</a>
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
            onChange={(event) => setSearchType(event.target.value)}
          >
            <option value="company">회사명</option>
            <option value="phone">전화번호</option>
          </select>
          <input
            className="search-input"
            type="text"
            placeholder="검색어 입력"
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


      {getRole() === "admin" ? (
      <section className="toolbar">
        <div className="tabs" aria-label="파트너 등급 탭">
          {PARTNER_GRADES.map((grade) => (
            <button
              key={grade}
              className={activeGrade === grade ? "tab is-active" : "tab"}
              type="button"
              onClick={() => handleGradeChange(grade)}
            >
              {grade}
            </button>
          ))}
        </div>
      </section>
      ) : null}

      <PartnerTable
        partners={partners}
        error={error}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </AdminLayout>
  );
}
