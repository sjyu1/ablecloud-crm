import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  const { id } = req.query;
  const token = req.cookies?.token || "";

  if (!token) {
    return res.status(401).json({
      message: "로그인이 필요합니다.",
    });
  }

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      message: "유효한 제품 정보가 아닙니다.",
    });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const target = new URL(`/products/${encodeURIComponent(id)}/download`, apiBaseUrl);
  const requestImpl = target.protocol === "https:" ? httpsRequest : httpRequest;

  const proxyRequest = requestImpl(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    (proxyResponse) => {
      res.statusCode = proxyResponse.statusCode || 500;

      const passthroughHeaders = [
        "content-type",
        "content-disposition",
        "content-length",
      ];

      passthroughHeaders.forEach((header) => {
        const value = proxyResponse.headers[header];

        if (value) {
          res.setHeader(header, value);
        }
      });

      proxyResponse.pipe(res);
    }
  );

  proxyRequest.on("error", () => {
    if (!res.headersSent) {
      res.status(502).json({
        message: "제품 ISO 파일 다운로드에 실패했습니다.",
      });
      return;
    }

    res.end();
  });

  proxyRequest.end();
}
