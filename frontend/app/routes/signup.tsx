import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/signup";
import { useState, type FormEvent } from "react";

import { AuthCard, FormField } from "~/components/AuthCard";
import { Button, StatusPanel } from "~/components/ui";
import { signUpWithEmail, validateEmail, validatePassword } from "~/services/authService";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign up | Collabify" }];
}

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const firstError = validateEmail(email) || validatePassword(password);
    if (firstError) { setStatus("error"); setMessage(firstError); return; }
    setStatus("loading");
    try { await signUpWithEmail(email, password); setStatus("success"); setMessage("Account created. Please verify your email before continuing."); setTimeout(() => navigate("/verify-email"), 900); }
    catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to create account."); }
  }
  return (
    <AuthCard
      title="Create your account"
      description="Join as a creator or business. Business verification is required before outreach and publishing campaigns."
      footer={
        <>
          Already have an account? <Link to="/login" className="font-bold text-cyan-700 dark:text-cyan-300">Log in</Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <FormField label="Email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        <FormField label="Password" name="password" type="password" placeholder="Create a secure password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
        <Button type="submit" disabled={status === "loading"} className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">{status === "loading" ? "Creating..." : "Create account"}</Button>
        {status !== "idle" && status !== "loading" && <StatusPanel type={status} title={status === "success" ? "Verify email" : "Signup issue"} message={message} />}
      </form>
    </AuthCard>
  );
}
