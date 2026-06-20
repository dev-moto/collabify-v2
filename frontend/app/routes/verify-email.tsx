import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { Link } from "react-router";
import { AuthCard, FormField } from "~/components/AuthCard";
import { Button, StatusPanel } from "~/components/ui";
import { resendVerificationEmail, validateEmail } from "~/services/authService";

export function meta() { return [{ title: "Verify email | Collabify" }]; }
export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const emailError = email ? validateEmail(email) : "";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const firstError = validateEmail(email);
    if (firstError) {
      setStatus("error");
      setMessage(firstError);
      return;
    }

    setStatus("loading");
    try {
      await resendVerificationEmail(email);
      setStatus("success");
      setMessage("Verification email sent. Check your inbox and spam folder.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to resend verification email.");
    }
  }

  return <AuthCard title="Verify your email" description="Open the confirmation link sent by Supabase Auth to protect your account." footer={<Link className="font-bold text-cyan-700" to="/login">I verified, go to login</Link>}><form className="grid gap-5" onSubmit={onSubmit} noValidate><StatusPanel type="empty" title="Waiting for verification" message="Check your inbox and spam folder. Verification protects creators and brands from impersonation." /><FormField label="Email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} aria-invalid={Boolean(emailError)} />{emailError && <p className="text-xs font-medium text-red-600" role="alert">{emailError}</p>}<Button type="submit" disabled={status === "loading"}><MailCheck className="h-4 w-4" /> {status === "loading" ? "Sending..." : "Resend verification email"}</Button>{status !== "idle" && status !== "loading" && <StatusPanel type={status} title={status === "success" ? "Email sent" : "Verification issue"} message={message} />}</form></AuthCard>;
}
