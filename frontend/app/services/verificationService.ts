import { supabase } from "~/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type VerificationStatus = "unsubmitted" | "pending" | "approved" | "rejected";

export type BusinessProfileExtended = {
  id: string;
  business_name: string;
  industry: string | null;
  city: string | null;
  verification_status: VerificationStatus;
  is_discoverable: boolean;
};

export type VerificationDocument = {
  id: string;
  business_id: string;
  storage_bucket: string;
  storage_path: string;
  document_type: string;
  status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type DocumentType = "dti_registration" | "sec_registration" | "government_id" | "business_permit" | "other";

const ALLOWED_DOCUMENT_TYPES: DocumentType[] = [
  "dti_registration",
  "sec_registration",
  "government_id",
  "business_permit",
  "other",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

/** Get the current business profile with verification status. */
export async function getBusinessProfile(): Promise<BusinessProfileExtended | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("business_profiles")
    .select("id, business_name, industry, city, verification_status, is_discoverable")
    .eq("id", user.id)
    .maybeSingle<BusinessProfileExtended>();

  if (error) throw error;
  return data;
}

/** List verification documents submitted by the current business. */
export async function listMyVerificationDocuments(): Promise<VerificationDocument[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("verification_documents")
    .select("*")
    .eq("business_id", user.id)
    .order("created_at", { ascending: false })
    .returns<VerificationDocument[]>();

  if (error) throw error;
  return data ?? [];
}

/** Upload a verification document to the private storage bucket and
 *  record metadata in the verification_documents table.
 *
 *  Steps:
 *  1. Validate file type and size.
 *  2. Upload to `verification-documents/{userId}/{filename}`.
 *  3. Insert metadata row into `verification_documents` table.
 *
 *  RLS policies enforce:
 *  - Storage: owner can write to `verification-documents/{userId}/`.
 *  - Table: insert only if `business_id = auth.uid()`, `status = 'pending'`,
 *    `reviewed_by IS NULL`, `reviewed_at IS NULL`. */
export async function submitVerificationDocument(
  file: File,
  documentType: DocumentType,
): Promise<VerificationDocument> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error(`Invalid document type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = ["pdf", "png", "jpg", "jpeg"];
  if (!allowedExts.includes(fileExt)) {
    throw new Error(`File type .${fileExt} is not supported. Allowed: ${allowedExts.join(", ")}`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  // 1. Upload file to private storage
  const storagePath = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("verification-documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // 2. Record metadata in verification_documents table
  const { data, error: insertError } = await supabase
    .from("verification_documents")
    .insert({
      business_id: user.id,
      storage_bucket: "verification-documents",
      storage_path: storagePath,
      document_type: documentType,
    })
    .select("*")
    .single<VerificationDocument>();

  if (insertError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from("verification-documents").remove([storagePath]);
    throw insertError;
  }

  return data;
}

/** Update the business profile verification status to 'pending'
 *  after the first document is submitted (if currently 'unsubmitted').
 *  Returns the updated profile. */
export async function markVerificationPending(): Promise<BusinessProfileExtended> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("business_profiles")
    .update({ verification_status: "pending" })
    .eq("id", user.id)
    .eq("verification_status", "unsubmitted") // Only update if still unsubmitted
    .select("id, business_name, industry, city, verification_status, is_discoverable")
    .single<BusinessProfileExtended>();

  if (error) throw error;
  if (!data) throw new Error("Could not update verification status. It may have already been changed.");
  return data;
}

/** Get a signed URL to view a submitted verification document.
 *  RLS restricts reads to owner or admin. */
export async function getDocumentUrl(storagePath: string): Promise<string | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(storagePath, 60); // 60-second expiry

  if (error) throw error;
  return data?.signedUrl ?? null;
}
