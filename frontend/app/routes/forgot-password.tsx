import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AuthCard, FormField } from "~/components/AuthCard";
import { Button, StatusPanel } from "~/components/ui";
import { sendPasswordReset, validateEmail } from "~/services/authService";

export function meta() { return [{ title: "Forgot password | Collabify" }]; }

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const error = email ? validateEmail(email) : "";

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
      await sendPasswordReset(email);
      setStatus("success");
      setMessage("If this email exists, Supabase will send a secure reset link.");
    } catch (resetError) {
      setStatus("error");
      setMessage(resetError instanceof Error ? resetError.message : "Unable to send reset link.");
    }
  }

  return <AuthCard title="Reset your password" description="We’ll send a secure reset link if the email exists in Collabify." footer={<Link to="/login" className="font-bold text-cyan-700">Back to login</Link>}>
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <FormField label="Email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} aria-invalid={Boolean(error)} />
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? "Sending..." : "Send reset link"}</Button>
      {status !== "idle" && status !== "loading" && <StatusPanel type={status} title={status === "success" ? "Check your inbox" : "Reset issue"} message={message} />}
    </form>
  </AuthCard>;
}
