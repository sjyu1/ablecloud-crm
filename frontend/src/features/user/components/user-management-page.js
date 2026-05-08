import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { UserTable } from "@/features/user/components/user-table";
import { getAuthToken, getRole } from "@/lib/auth";

const USER_TABS = ["PARTNER", "CUSTOMER", "VENDOR"];

export function UserManagementPage() {
  const [currentRole, setCurrentRole] = useState("user");
  const visibleTabs = currentRole === "user" ? USER_TABS.filter((tab) => tab !== "VENDOR") : USER_TABS;
  const defaultTab = visibleTabs[0] || "PARTNER";
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchType, setSearchType] = useState("id");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    setCurrentRole(getRole());
  }, []);

  useEffect(() => {
    void fetchUsers({
      searchType: "id",
      keyword: "",
      type: defaultTab,
      page: 1,
    });
  }, []);

  async function fetchUsers(nextQuery) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("searchType", nextQuery.searchType);
    params.set("type", String(nextQuery.type || "PARTNER").toLowerCase());
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

      const response = await fetch(`${apiBaseUrl}/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사용자 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setUsers(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.pagination?.page || nextQuery.page || 1,
        limit: data.pagination?.limit || current.limit,
        total: data.pagination?.total || 0,
      }));
    } catch (fetchError) {
      setUsers([]);
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
    void fetchUsers({
      searchType,
      keyword,
      type: activeTab,
      page: 1,
    });
  }

  function handleReset() {
    setSearchType("id");
    setKeyword("");
    setActiveTab(defaultTab);
    void fetchUsers({
      searchType: "id",
      keyword: "",
      type: defaultTab,
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }

    void fetchUsers({
      searchType,
      keyword,
      type: activeTab,
      page: nextPage,
    });
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    void fetchUsers({
      searchType,
      keyword,
      type: nextTab,
      page: 1,
    });
  }

  return (
    <AdminLayout
      activePath="/user"
      title="사용자 관리"
      actions={
        <Link href="/users/create" legacyBehavior>
          <a className="primary-button">사용자 등록</a>
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
            <option value="id">아이디</option>
            <option value="email">이메일</option>
            <option value="name">이름</option>
            <option value="company">회사</option>
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

      <section className="toolbar">
        <div className="tabs" aria-label="사용자 구분 탭">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab is-active" : "tab"}
              type="button"
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <UserTable users={users} error={error} isLoading={isLoading} onPageChange={handlePageChange} pagination={pagination} />
    </AdminLayout>
  );
}
