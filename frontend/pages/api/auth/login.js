function parseJwtPayload(token) {
  const [, payload = ""] = token.split(".");
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function resolveAppRole(roles) {
  if (roles.includes("Admin")) {
    return "admin";
  }

  return "user";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      message: "아이디와 비밀번호를 입력해주세요.",
    });
  }

  const keycloakApiUrl = process.env.KEYCLOAK_API_URL;
  const keycloakRealm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const grantType = process.env.GRANT_TYPE || "password";
  const scope = process.env.SCOPE || "profile email openid";

  if (!keycloakApiUrl || !keycloakRealm || !clientId || !clientSecret) {
    return res.status(500).json({
      message: "Keycloak 환경변수가 설정되지 않았습니다.",
    });
  }

  try {
    const tokenUrl = `${keycloakApiUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

    console.log(`[auth/login] token request: ${tokenUrl}`);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: grantType,
        scope,
        username,
        password,
      }).toString(),
    });
    const responseText = await response.text();

    console.log(`[auth/login] token response: status=${response.status}`);

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(
        `[auth/login] token response parse failed: ${responseText.slice(0, 500)}`
      );

      return res.status(502).json({
        message: "인증 서버 응답을 해석하지 못했습니다.",
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        message: data.error_description || data.error || "로그인에 실패했습니다.",
      });
    }

    const payload = parseJwtPayload(data.access_token);
    const realmRoles = payload.realm_access?.roles || [];
    const clientRoles = Object.values(payload.resource_access || {}).flatMap(
      (resource) => resource?.roles || []
    );
    const roles = [...new Set([...realmRoles, ...clientRoles])];
    const role = resolveAppRole(roles);

    return res.status(200).json({
      token: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      user: {
        username,
        role,
      },
    });
  } catch (error) {
    console.error(
      "[auth/login] token request failed:",
      error instanceof Error ? error.stack || error.message : error
    );

    return res.status(500).json({
      message: "인증 서버와 통신하지 못했습니다.",
    });
  }
}
