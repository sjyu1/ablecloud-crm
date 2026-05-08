import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AdminLayout } from "@/features/common/components/admin-layout";
import { getAuthToken } from "@/lib/auth";

function getCompanySortGroup(label) {
  const trimmedLabel = String(label || "").trim();

  if (/^[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(trimmedLabel)) {
    return 0;
  }

  if (/^[A-Za-z]/.test(trimmedLabel)) {
    return 1;
  }

  return 2;
}

function sortCompanyOptions(options) {
  return [...options].sort((left, right) => {
    const leftLabel = String(left.label || "");
    const rightLabel = String(right.label || "");
    const leftGroup = getCompanySortGroup(leftLabel);
    const rightGroup = getCompanySortGroup(rightLabel);

    if (leftGroup !== rightGroup) {
      return leftGroup - rightGroup;
    }

    return leftLabel.localeCompare(rightLabel, leftGroup === 1 ? "en" : "ko");
  });
}

function formatCompanyOptions(companyOptions) {
  return {
    partner: sortCompanyOptions(companyOptions?.partner || []),
    customer: sortCompanyOptions(companyOptions?.customer || []),
    vendor: sortCompanyOptions(companyOptions?.vendor || []),
  };
}

export function UserCreatePage() {
  const router = useRouter();
  const [role, setRole] = useState("User");
  const [roleOptions, setRoleOptions] = useState([{ id: "User", label: "User" }]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [type, setType] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyOptions, setCompanyOptions] = useState({
    partner: [],
    customer: [],
    vendor: [],
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telnum, setTelnum] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetchFormOptions();
  }, []);

  async function fetchFormOptions() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    setIsLoading(true);
    setError("");

    try {
      if (!authToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiBaseUrl}/users/meta/options`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사용자 등록 옵션을 불러오지 못했습니다.");
      }

      const data = await response.json();
      const nextRoleOptions = data.roleOptions || [{ id: "User", label: "User" }];
      const nextTypeOptions = data.typeOptions || [];

      setRoleOptions(nextRoleOptions);
      setTypeOptions(nextTypeOptions);
      setCompanyOptions(formatCompanyOptions(data.companyOptions || {}));
      setRole(String(nextRoleOptions[0]?.id || "User"));

      if (nextTypeOptions.length === 1) {
        setType(String(nextTypeOptions[0].id || ""));
      }
    } catch (fetchError) {
      setRoleOptions([{ id: "User", label: "User" }]);
      setTypeOptions([]);
      setCompanyOptions({ partner: [], customer: [], vendor: [] });
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleTypeChange(event) {
    const nextType = event.target.value;
    const nextOptions = companyOptions[nextType] || [];

    setType(nextType);
    setCompanyId(nextOptions.length === 1 && nextType === "vendor" ? String(nextOptions[0].id) : "");

    if (nextType === "customer") {
      setPassword("");
      setPasswordConfirm("");
    }
  }

  function validateForm() {
    const isCustomerType = type === "customer";

    if (!type) {
      return "type을 선택해주세요.";
    }

    if (!companyId) {
      return "회사를 선택해주세요.";
    }

    if (!username.trim()) {
      return "아이디를 입력해주세요.";
    }

    if (!isCustomerType && !password) {
      return "비밀번호를 입력해주세요.";
    }

    if (!isCustomerType && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      return "비밀번호는 8자 이상이며 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.";
    }

    if (!isCustomerType && password !== passwordConfirm) {
      return "비밀번호 확인이 일치하지 않습니다.";
    }

    if (!name.trim()) {
      return "이름을 입력해주세요.";
    }

    if (!email.trim()) {
      return "이메일을 입력해주세요.";
    }

    if (!telnum.trim()) {
      return "전화번호를 입력해주세요.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authToken = getAuthToken();

    if (!authToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("사용자를 등록하시겠습니까?")) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        role,
        type,
        companyId,
        username,
        name,
        email,
        telnum,
      };

      if (type !== "customer") {
        payload.password = password;
        payload.passwordConfirm = passwordConfirm;
      }

      const response = await fetch(`${apiBaseUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "사용자 등록에 실패했습니다.");
      }

      await router.push("/user");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentCompanyOptions = companyOptions[type] || [];
  const isCustomerType = type === "customer";

  return (
    <AdminLayout activePath="/user" title="사용자 등록" actions={null}>
      <form className="license-create-card" onSubmit={handleSubmit}>
        {isLoading ? <p className="form-feedback">사용자 등록 옵션을 불러오는 중입니다.</p> : null}
        <div className="license-create-grid">
          <label className="form-field">
            <span className="form-label">Role</span>
            <select className="form-control" value={role} onChange={(event) => setRole(event.target.value)} disabled={isLoading}>
              {roleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">type</span>
            <select className="form-control" value={type} onChange={handleTypeChange} disabled={isLoading}>
              <option value="">선택하세요</option>
              {typeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">company</span>
            <select className="form-control" value={companyId} onChange={(event) => setCompanyId(event.target.value)} disabled={isLoading || !type}>
              <option value="">선택하세요</option>
              {currentCompanyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">아이디</span>
            <input className="form-control" type="text" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          {!isCustomerType ? (
            <>
              <label className="form-field">
                <span className="form-label">비밀번호 (비밀번호는 8자 이상, 대문자/소문자/특수문자/숫자를 모두 포함)</span>
                <input className="form-control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>

              <label className="form-field">
                <span className="form-label">비밀번호 확인</span>
                <input className="form-control" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} />
              </label>
            </>
          ) : null}

          <label className="form-field">
            <span className="form-label">이름</span>
            <input className="form-control" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-label">이메일</span>
            <input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-label">전화번호 (-포함)</span>
            <input className="form-control" type="text" value={telnum} onChange={(event) => setTelnum(event.target.value)} />
          </label>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <div className="form-actions">
          <Link href="/user" legacyBehavior>
            <a className="secondary-button">목록</a>
          </Link>
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
