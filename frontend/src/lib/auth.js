const TOKEN_KEY = "token";
const USERNAME_KEY = "username";
const ROLE_KEY = "role";

function readStorage(name) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(name) || "";
}

function writeStorage(name, value) {
  if (typeof window === "undefined") {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(name);
    return;
  }

  window.localStorage.setItem(name, value);
}

function readCookie(name) {
  if (typeof document === "undefined") {
    return "";
  }

  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return entry ? decodeURIComponent(entry.split("=").slice(1).join("=")) : "";
}

function writeCookie(name, value, maxAgeSeconds) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function getAuthToken() {
  return readCookie(TOKEN_KEY) || readStorage(TOKEN_KEY);
}

export function getUsername() {
  return readCookie(USERNAME_KEY) || readStorage(USERNAME_KEY);
}

export function getRole() {
  return readCookie(ROLE_KEY) || readStorage(ROLE_KEY) || "user";
}

export function setAuthSession({ token, username, role = "user" }) {
  const maxAge = 60 * 60 * 8;
  const serializedRole = String(role);

  writeCookie(TOKEN_KEY, token, maxAge);
  writeCookie(USERNAME_KEY, username, maxAge);
  writeCookie(ROLE_KEY, serializedRole, maxAge);
  writeStorage(TOKEN_KEY, token);
  writeStorage(USERNAME_KEY, username);
  writeStorage(ROLE_KEY, serializedRole);
}

export function clearAuthSession() {
  writeCookie(TOKEN_KEY, "", 0);
  writeCookie(USERNAME_KEY, "", 0);
  writeCookie(ROLE_KEY, "", 0);
  writeStorage(TOKEN_KEY, "");
  writeStorage(USERNAME_KEY, "");
  writeStorage(ROLE_KEY, "");
}
