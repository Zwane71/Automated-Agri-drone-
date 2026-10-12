
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, ArrowRight, LoaderCircle } from "lucide-react";
import { registerUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({ username, email, password });

      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));

      router.replace("/home");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFBF7] px-5 py-12 text-stone-900">
      <section className="w-full max-w-md">
        <Link href="/" className="mb-9 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-900 text-lime-300">
            <Sprout size={27} />
          </span>
          <span className="text-2xl font-bold tracking-tight">
            Agri<span className="text-green-700">Vision</span>
            <span className="ml-1 text-sm font-medium text-stone-500">AI</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-xl shadow-green-950/5 sm:p-9">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-green-800">
            Get started
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            Register to access crop detection, disease analysis, and field monitoring.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
                placeholder="Enter your password again"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 px-5 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-stone-600">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-green-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-stone-500">
          Your account is registered with the AgriVision AI platform.
        </p>
      </section>
    </main>
  );
}
