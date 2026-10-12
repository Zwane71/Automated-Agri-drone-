
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, AuthSessionError } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<
    "checking" | "authorized" | "error"
  >("checking");

  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      setStatus("checking");
      setMessage("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await getCurrentUser(token);

        if (active) {
          setStatus("authorized");
        }
      } catch (error) {
        if (!active) return;

        if (
          error instanceof AuthSessionError &&
          (error.status === 401 || error.status === 403)
        ) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("auth_user");
          router.replace("/login");
          return;
        }

        if (error instanceof AuthSessionError) {
          setMessage(
            `The server could not verify your session (HTTP ${error.status}). Please try again.`
          );
        } else {
          setMessage(
            "Unable to connect to the AgriDrone server. Check that the backend is running and try again."
          );
        }

        setStatus("error");
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [pathname, router, retry]);

  if (status !== "authorized") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBF7] px-6">
        <div className="w-full max-w-md text-center">
          {status === "checking" ? (
            <>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              <p className="text-sm text-stone-600">
                Verifying your session...
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-stone-900">
                Session verification failed
              </h2>

              <p className="mt-3 text-sm text-stone-600">
                {message}
              </p>

              <button
                onClick={() => setRetry((value) => value + 1)}
                className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Try again
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("auth_user");
                  router.replace("/login");
                }}
                className="ml-3 rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
