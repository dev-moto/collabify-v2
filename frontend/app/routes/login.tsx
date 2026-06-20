import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { useState, type FormEvent } from "react";

import { AuthCard, FormField } from "~/components/AuthCard";
import { Button, StatusPanel } from "~/components/ui";
import { signInWithEmail, validateEmail, validatePassword } from "~/services/authService";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Log in | Collabify" }];
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const emailError = email ? validateEmail(email) : "";
  const passwordError = password ? validatePassword(password) : "";
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const firstError = validateEmail(email) || validatePassword(password);
    if (firstError) { setStatus("error"); setMessage(firstError); return; }
    setStatus("loading");
    try { await signInWithEmail(email, password); setStatus("success"); setMessage("Login successful. Redirecting to onboarding..."); setTimeout(() => navigate("/onboarding"), 600); }
    catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to log in."); }
  }
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to manage your profile, conversations, appointments, and campaigns. Supabase auth wiring comes next."
      footer={
        <>
          New to Collabify? <Link to="/signup" className="font-bold text-cyan-700 dark:text-cyan-300">Create an account</Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <FormField label="Email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} aria-invalid={Boolean(emailError)} />
        {emailError && <p className="text-xs font-medium text-red-600" role="alert">{emailError}</p>}
        <FormField label="Password" name="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.currentTarget.value)} aria-invalid={Boolean(passwordError)} />
        {passwordError && <p className="text-xs font-medium text-red-600" role="alert">{passwordError}</p>}
        <div className="flex items-center justify-between text-sm"><Link to="/forgot-password" className="font-bold text-cyan-700 dark:text-cyan-300">Forgot password?</Link></div>
        <Button type="submit" disabled={status === "loading"}>{status === "loading" ? "Logging in..." : "Log in"}</Button>
        {status !== "idle" && status !== "loading" && <StatusPanel type={status} title={status === "success" ? "Success" : "Login issue"} message={message} />}
      </form>
    </AuthCard>
  );
}
