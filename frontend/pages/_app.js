import { useEffect } from "react";
import Head from "next/head";
import "@/styles/globals.css";
import { clearAuthSession } from "@/lib/auth";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined" || window.__authFetchPatched) {
      return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await clonedResponse.json();

          if (data?.message === "Failed to fetch user information") {
            clearAuthSession();

            if (!window.location.pathname.startsWith("/login")) {
              window.location.replace("/api/logout");
            }
          }
        }
      } catch (error) {
        // Ignore response parsing failures and leave per-page error handling intact.
      }

      return response;
    };

    window.__authFetchPatched = true;
  }, []);

  return (
    <>
      <Head>
        <title>ABLESTACK LICENSE</title>
        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/ablestack-logo.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
