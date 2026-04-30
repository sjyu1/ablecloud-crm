import { useState } from "react";
import { useRouter } from "next/router";
import { setAuthSession } from "@/lib/auth";

export function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const message = (() => {
    if (typeof router.query.message === "string" && router.query.message) {
      return router.query.message;
    }

    if (router.query.reason === "session-expired") {
      return "로그인 유효시간이 지나 로그아웃됩니다.";
    }

    return "";
  })();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!username || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "아이디 또는 비밀번호가 올바르지 않습니다."
        );
      }

      setAuthSession({
        token: data.token,
        username: data.user?.username || username,
        role: data.user?.role || "user",
      });

      await router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "로그인에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark" aria-label="ABLESTACK">
            <img className="login-logo" src="/ablestack-logo.png" alt="Logo" />
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>아이디</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="아이디를 입력하세요"
            />
          </label>

          <label className="login-field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}
          {message ? <p className="login-message">{message}</p> : null}

          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </button>

        </form>

        <div className="login-help">
          <p>문의사항은 아래 연락처로 문의해주세요.</p>
          <p>대표전화 : 1544-3696</p>
          <p>영업 : sales@ablestack.co.kr</p>
          <p>기술지원 : support@ablestack.co.kr</p>
        </div>
      </section>
    </main>
  );
}
