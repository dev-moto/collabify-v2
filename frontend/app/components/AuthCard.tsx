import type { InputHTMLAttributes, ReactNode } from "react";

import { BrandLogo } from "./BrandLogo";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/5">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          <div className="mt-8">{children}</div>
        </section>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">{footer}</div>
      </div>
    </main>
  );
}

export function FormField({
  label,
  type = "text",
  name,
  placeholder,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  type?: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <input
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500/20 transition focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white"
        type={type}
        name={name}
        placeholder={placeholder}
        {...props}
      />
    </label>
  );
}
