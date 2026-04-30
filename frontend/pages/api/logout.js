export default function handler(req, res) {
  const expiredCookies = [
    "token=; Path=/; Max-Age=0; SameSite=Lax",
    "username=; Path=/; Max-Age=0; SameSite=Lax",
    "role=; Path=/; Max-Age=0; SameSite=Lax",
  ];

  res.setHeader("Set-Cookie", expiredCookies);
  res.writeHead(302, {
    Location: "/login",
  });
  res.end();
}
