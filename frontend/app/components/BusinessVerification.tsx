import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge, Button, Card, StatusPanel } from "~/components/ui";
import {
  getBusinessProfile,
  listMyVerificationDocuments,
  submitVerificationDocument,
  markVerificationPending,
  type BusinessProfileExtended,
  type VerificationDocument,
  type VerificationStatus,
  type DocumentType,
} from "~/services/verificationService";

/* ------------------------------------------------------------------ */
/*  Status helper                                                       */
/* ------------------------------------------------------------------ */

function statusBadge(
  status: VerificationStatus,
): { tone: "green" | "amber" | "red" | "slate"; label: string } {
  if (status === "approved") return { tone: "green", label: "Approved" };
  if (status === "pending") return { tone: "amber", label: "Under review" };
  if (status === "rejected") return { tone: "red", label: "Rejected" };
  return { tone: "slate", label: "Not submitted" };
}

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  onStatusChange?: (status: VerificationStatus) => void;
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function BusinessVerification({ onStatusChange }: Props) {
  const [profile, setProfile] = useState<BusinessProfileExtended | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("dti_registration");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setStatus("loading");
    try {
      const [prof, docs] = await Promise.all([
        getBusinessProfile(),
        listMyVerificationDocuments(),
      ]);
      if (prof) {
        setProfile(prof);
        onStatusChange?.(prof.verification_status);
      }
      setDocuments(docs);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verification data.");
      setStatus("error");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setUploadResult("error");
      setUploadMessage("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadResult("idle");
    try {
      // 1. Upload document
      await submitVerificationDocument(file, documentType);

      // 2. Mark verification as pending if it was unsubmitted
      if (profile?.verification_status === "unsubmitted") {
        const updated = await markVerificationPending();
        setProfile(updated);
        onStatusChange?.(updated.verification_status);
      }

      // 3. Refresh document list
      const docs = await listMyVerificationDocuments();
      setDocuments(docs);

      // Reset form
      setFile(null);
      setDocumentType("dti_registration");
      if (fileInputRef.current) fileInputRef.current.value = "";

      setUploadResult("success");
      setUploadMessage("Document submitted for review.");
    } catch (err) {
      setUploadResult("error");
      setUploadMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (status === "loading") {
    return <StatusPanel type="loading" title="Loading verification status" message="Please wait..." />;
  }

  if (status === "error") {
    return <StatusPanel type="error" title="Failed to load" message={error} />;
  }

  if (!profile) {
    return <StatusPanel type="empty" title="No business profile" message="Complete onboarding to set up your business profile." />;
  }

  const ver = statusBadge(profile.verification_status);
  const isVerified = profile.verification_status === "approved";
  const canSubmit = profile.verification_status === "unsubmitted" || profile.verification_status === "rejected";

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className={`h-8 w-8 ${isVerified ? "text-emerald-500" : "text-slate-400"}`} />
            <div>
              <h2 className="text-xl font-black">Business verification</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {profile.business_name}
              </p>
            </div>
          </div>
          <Badge tone={ver.tone}>{ver.label}</Badge>
        </div>

        {isVerified && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Your business is verified. You can now publish campaigns and reach out to creators.
          </div>
        )}

        {profile.verification_status === "rejected" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
            <XCircle className="h-4 w-4" />
            Your verification was rejected. Please submit new documents for review.
          </div>
        )}

        {profile.verification_status === "pending" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Your documents are under review. This usually takes 1-3 business days.
          </div>
        )}
      </Card>

      {/* Submitted documents */}
      {documents.length > 0 && (
        <Card>
          <h2 className="text-xl font-black">Submitted documents</h2>
          <ul className="mt-4 space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">
                    {doc.document_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
                <Badge
                  tone={
                    doc.status === "approved"
                      ? "green"
                      : doc.status === "rejected"
                        ? "red"
                        : "amber"
                  }
                >
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Upload form — only if not yet verified */}
      {canSubmit && (
        <Card>
          <h2 className="text-xl font-black">
            {profile.verification_status === "rejected"
              ? "Resubmit documents"
              : "Submit verification documents"}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Upload your DTI/SEC registration, business permit, or government ID.
            Accepted formats: PDF, PNG, JPG (max 10 MB).
          </p>

          <form className="mt-4 grid gap-4" onSubmit={handleSubmit} noValidate>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Document type
              <select
                className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                value={documentType}
                onChange={(e) => setDocumentType(e.currentTarget.value as DocumentType)}
              >
                <option value="dti_registration">DTI Registration</option>
                <option value="sec_registration">SEC Registration</option>
                <option value="government_id">Government ID</option>
                <option value="business_permit">Business Permit</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              File
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="block w-full rounded-2xl border border-slate-200 p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white dark:border-white/10 dark:file:bg-white dark:file:text-slate-950"
                onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              />
            </label>

            <Button type="submit" disabled={uploading || !file}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Submit document
                </>
              )}
            </Button>

            {uploadResult !== "idle" && (
              <StatusPanel
                type={uploadResult}
                title={uploadResult === "success" ? "Submitted" : "Upload failed"}
                message={uploadMessage}
              />
            )}
          </form>
        </Card>
      )}
    </div>
  );
}
