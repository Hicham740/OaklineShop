"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
} from "react";
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

type SignupField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword";

type SignupErrors = Partial<Record<SignupField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALGERIAN_PHONE_PATTERN = /^(?:\+213|00213|0)[5-7]\d{8}$/;

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const { t } = useLanguage();
  const { user, loading, signup } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(destinationFor(user, next));
    }
  }, [loading, user, next, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const errors: SignupErrors = {};
    if (!firstName.trim()) errors.firstName = t.errRequired;
    if (!lastName.trim()) errors.lastName = t.errRequired;

    const cleanEmail = email.trim();
    if (!cleanEmail) errors.email = t.errRequired;
    else if (!EMAIL_PATTERN.test(cleanEmail)) errors.email = t.errEmail;

    const cleanPhone = phone.replace(/[\s\-().]/g, "");
    if (cleanPhone && !ALGERIAN_PHONE_PATTERN.test(cleanPhone)) {
      errors.phone = t.errPhone;
    }

    if (password.length < 8) errors.password = t.passwordHint;
    if (password !== confirmPassword) {
      errors.confirmPassword = t.passwordMismatch;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstInvalid = (
        [
          "firstName",
          "lastName",
          "email",
          "phone",
          "password",
          "confirmPassword",
        ] as const
      ).find((field) => errors[field]);
      if (firstInvalid) {
        requestAnimationFrame(() =>
          document.getElementById(`signup-${firstInvalid}`)?.focus(),
        );
      }
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const created = await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: cleanPhone || undefined,
        password,
      });
      router.replace(destinationFor(created, next));
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

  const loginHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  const inputProps = (field: SignupField) => ({
    "aria-invalid": Boolean(fieldErrors[field]),
    "aria-describedby": fieldErrors[field]
      ? `signup-${field}-error`
      : undefined,
  });

  return (
    <AuthShell
      title={t.signupTitle}
      subtitle={t.signupSubtitle}
      footer={
        <>
          {t.alreadyHaveAccount}{" "}
          <Link
            href={loginHref}
            className="font-semibold text-[#0e7a5d] hover:underline"
          >
            {t.signIn}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            htmlFor="signup-firstName"
            label={t.firstName}
            error={fieldErrors.firstName}
          >
            <input
              id="signup-firstName"
              name="firstName"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={authInputClass}
              {...inputProps("firstName")}
            />
          </AuthField>

          <AuthField
            htmlFor="signup-lastName"
            label={t.lastName}
            error={fieldErrors.lastName}
          >
            <input
              id="signup-lastName"
              name="lastName"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={authInputClass}
              {...inputProps("lastName")}
            />
          </AuthField>
        </div>

        <AuthField
          htmlFor="signup-email"
          label={t.email}
          error={fieldErrors.email}
        >
          <input
            id="signup-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            className={authInputClass}
            {...inputProps("email")}
          />
        </AuthField>

        <AuthField
          htmlFor="signup-phone"
          label={t.phoneOptional}
          error={fieldErrors.phone}
        >
          <input
            id="signup-phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0550 12 34 56"
            inputMode="tel"
            dir="ltr"
            className={authInputClass}
            {...inputProps("phone")}
          />
        </AuthField>

        <AuthField
          htmlFor="signup-password"
          label={t.password}
          error={fieldErrors.password}
        >
          <input
            id="signup-password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            dir="ltr"
            className={authInputClass}
            aria-describedby={
              fieldErrors.password
                ? "signup-password-error"
                : "signup-password-hint"
            }
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {!fieldErrors.password && (
            <p id="signup-password-hint" className="mt-1.5 text-xs text-gray-500">
              {t.passwordHint}
            </p>
          )}
        </AuthField>

        <AuthField
          htmlFor="signup-confirmPassword"
          label={t.confirmPassword}
          error={fieldErrors.confirmPassword}
        >
          <input
            id="signup-confirmPassword"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            dir="ltr"
            className={authInputClass}
            {...inputProps("confirmPassword")}
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
          {submitting ? t.creatingAccount : t.createAccount}
        </button>
      </form>
    </AuthShell>
  );
}

function SignupFallback() {
  const { t } = useLanguage();
  return (
    <div role="status" className="mx-auto max-w-[440px] py-16">
      <div className="h-[520px] animate-pulse rounded-3xl bg-gray-100" />
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}

export default function SignupPage() {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="w-full flex-1 px-5">
        <Suspense fallback={<SignupFallback />}>
          <SignupForm />
        </Suspense>
      </main>
      <Footer full={false} />
    </>
  );
}
