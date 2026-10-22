import { Logo } from "@/components/Logo";
import type { ReactNode } from "react";

export const authInputClass =
  "mt-1.5 w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#0e7a5d]";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[440px] py-12 sm:py-16">
      <div className="flex items-center justify-center gap-2.5">
        <Logo size={36} />
        <span className="text-2xl font-extrabold tracking-tight">Oakline</span>
      </div>

      <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_10px_40px_rgba(20,23,29,0.06)] sm:p-8">
        <h1 className="text-[30px] font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
          {subtitle}
        </p>
        <div className="mt-6">{children}</div>
      </div>

      <div className="mt-5 text-center text-sm text-gray-600">{footer}</div>
    </div>
  );
}

export function AuthField({
  htmlFor,
  label,
  error,
  children,
}: {
  htmlFor: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
