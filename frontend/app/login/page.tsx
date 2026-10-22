"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  AuthField,
  AuthShell,
  authInputClass,
} from "@/components/auth/AuthShell";
import { ApiError } from "@/lib/api";
import {
  destinationFor,
  safeNextPath,
  useAuth,
} from "@/lib/auth";
import { useLanguage } from "@/lib/language";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const { t } = useLanguage();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A signed-in visitor should not see the form again. This also handles an
  // admin opening the shared form from the protected /admin area.
  useEffect(() => {
    if (!loading && user) {
      router.replace(destinationFor(user, next));
    }
  }, [loading, user, next, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const signedIn = await login({ email, password });
      router.replace(destinationFor(signedIn, next));
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We could not reach the server. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const signupHref = next
    ? `/signup?next=${encodeURIComponent(next)}`
    : "/signup";

  return (
    <AuthShell
      title={t.loginTitle}
      subtitle={t.loginSubtitle}
      footer={
        <>
          {t.newToOakline}{" "}
          <Link
            href={signupHref}
            className="font-semibold text-[#0e7a5d] hover:underline"
          >
            {t.createAccount}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField htmlFor="login-email" label={t.email}>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            className={authInputClass}
          />
        </AuthField>

        <AuthField htmlFor="login-password" label={t.password}>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            dir="ltr"
            className={authInputClass}
          />
        </AuthField>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#0e7a5d] py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#0b654d] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          {submitting ? t.signingIn : t.signIn}
        </button>
      </form>
    </AuthShell>
  );
}

function LoginFallback() {
  const { t } = useLanguage();
  return (
    <div role="status" className="mx-auto max-w-[440px] py-16">
      <div className="h-80 animate-pulse rounded-3xl bg-gray-100" />
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="w-full flex-1 px-5">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer full={false} />
    </>
  );
}
