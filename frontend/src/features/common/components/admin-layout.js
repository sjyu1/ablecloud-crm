import { useEffect, useState } from "react";
import Link from "next/link";
import { navigationItems } from "@/data/navigation";
import { clearAuthSession, getRole, getUsername } from "@/lib/auth";

function NavIcon({ type }) {
  return <span className={`nav-icon nav-icon-${type}`} aria-hidden="true" />;
}

export function AdminLayout({ title, actions, children, activePath }) {
  const [username, setUsername] = useState("사용자");
  const [role, setRole] = useState("user");

  useEffect(() => {
    const storedUsername = getUsername();
    const storedRole = getRole();

    if (storedUsername) {
      setUsername(storedUsername);
    }

    setRole(String(storedRole || "user").toLowerCase());
  }, []);

  function handleLogout(event) {
    event.preventDefault();
    clearAuthSession();
    window.location.href = "/api/logout";
  }

  return (
    <main className="license-page">
      <header className="global-header">
        <div className="brand-mark" aria-label="ABLESTACK">
          <img className="header-logo" src="/ablestack-logo.png" alt="Logo" />
        </div>

        <div className="user-bar">
          <p className="welcome-text">
            <strong>{username}</strong>님 환영합니다
          </p>
          <Link href="/api/logout" legacyBehavior>
            <a className="logout-button" onClick={handleLogout}>로그아웃</a>
          </Link>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="side-nav">
          <nav className="side-nav-menu" aria-label="주요 메뉴">
            {navigationItems
              .filter((item) => !item.roles || item.roles.includes(role))
              .map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  legacyBehavior
                >
                  <a className={item.href === activePath ? "side-nav-item is-active" : "side-nav-item"}>
                    <NavIcon type={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
          </nav>
        </aside>

        <section className="page-shell">
          <header className="page-header">
            <h1 className="page-title">{title}</h1>
            {actions}
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
