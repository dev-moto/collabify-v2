import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, ExternalLink, Flag, Loader2, ScrollText, ShieldCheck, Users, XCircle } from "lucide-react";
import { AppShell, Badge, Button, Card, ProtectedRoute, Stat, StatusPanel } from "~/components/ui";
import {
  listPendingVerifications,
  listAuditLogs,
  listReports,
  updateVerificationStatus,
  listVerificationDocuments,
  updateReportStatus,
  recordAdminAction,
  type VerificationItem,
  type AuditLogEntry,
  type Report,
} from "~/services/adminService";
import type { VerificationDocument } from "~/services/verificationService";
import { getDocumentUrl } from "~/services/verificationService";

export function meta() { return [{ title: "Admin | Collabify" }]; }

type ExpandedState = Record<string, boolean>;
type DocMap = Record<string, VerificationDocument[]>;
type DocUrlMap = Record<string, string>;

async function loadDocumentUrls(docs: VerificationDocument[]): Promise<DocUrlMap> {
  const entries = await Promise.all(
    docs.map(async (d) => {
      try {
        const url = await getDocumentUrl(d.storage_path);
        return [d.id, url ?? ""] as const;
      } catch {
        return [d.id, ""] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export default function Admin() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Expanded state for verification details
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [documents, setDocuments] = useState<DocMap>({});
  const [docUrls, setDocUrls] = useState<DocUrlMap>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});

  // Action state
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setStatus("loading");
    try {
      const [v, a, r] = await Promise.all([
        listPendingVerifications(),
        listAuditLogs(),
        listReports(),
      ]);
      setVerifications(v);
      setAuditLogs(a);
      setReports(r);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
      setStatus("error");
    }
  }

  const toggleExpand = useCallback(async (businessId: string) => {
    setExpanded((prev) => {
      const next = { ...prev };
      // Toggle
      if (next[businessId]) {
        delete next[businessId];
      } else {
        next[businessId] = true;
      }
      return next;
    });

    // Load documents if opening and not yet loaded
    if (!expanded[businessId] && !documents[businessId]) {
      setLoadingDocs((prev) => ({ ...prev, [businessId]: true }));
      try {
        const docs = await listVerificationDocuments(businessId);
        setDocuments((prev) => ({ ...prev, [businessId]: docs }));
        // Get signed URLs
        const urls = await loadDocumentUrls(docs);
        setDocUrls((prev) => ({ ...prev, ...urls }));
      } catch {
        // Silently fail — user can still see the status
      } finally {
        setLoadingDocs((prev) => ({ ...prev, [businessId]: false }));
      }
    }
  }, [expanded, documents]);

  async function handleApprove(businessId: string, businessName: string) {
    setActionLoading((prev) => ({ ...prev, [`approve-${businessId}`]: true }));
    setActionError("");
    try {
      await updateVerificationStatus(businessId, "approved");
      await recordAdminAction(`Approved verification for ${businessName}`, {
        business_id: businessId,
        new_status: "approved",
      });
      // Refresh
      await loadData();
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[businessId];
        return next;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`approve-${businessId}`]: false }));
    }
  }

  async function handleReject(businessId: string, businessName: string) {
    setActionLoading((prev) => ({ ...prev, [`reject-${businessId}`]: true }));
    setActionError("");
    try {
      await updateVerificationStatus(businessId, "rejected");
      await recordAdminAction(`Rejected verification for ${businessName}`, {
        business_id: businessId,
        new_status: "rejected",
      });
      await loadData();
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[businessId];
        return next;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reject-${businessId}`]: false }));
    }
  }

  async function handleResolveReport(reportId: string) {
    setActionLoading((prev) => ({ ...prev, [`resolve-${reportId}`]: true }));
    try {
      await updateReportStatus(reportId, "resolved");
      await recordAdminAction(`Resolved report ${reportId}`, { report_id: reportId });
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to resolve report.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`resolve-${reportId}`]: false }));
    }
  }

  async function handleDismissReport(reportId: string) {
    setActionLoading((prev) => ({ ...prev, [`dismiss-${reportId}`]: true }));
    try {
      await updateReportStatus(reportId, "dismissed");
      await recordAdminAction(`Dismissed report ${reportId}`, { report_id: reportId });
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to dismiss report.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`dismiss-${reportId}`]: false }));
    }
  }

  return (
    <ProtectedRoute>
      <AppShell role="admin" title="Admin review center" description="Review verification documents, manage reports, and monitor audit logs.">
        {status === "loading" && <StatusPanel type="loading" title="Loading admin panel" message="Please wait while we load data." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
        {status === "success" && (
          <>
            {actionError && (
              <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300" role="alert">
                {actionError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={ShieldCheck} label="Pending verifications" value={String(verifications.length)} />
              <Stat icon={Flag} label="Open reports" value={String(reports.filter((r) => r.status === "open" || r.status === "reviewing").length)} />
              <Stat icon={Users} label="Moderation queue" value={String(reports.length)} />
              <Stat icon={ScrollText} label="Audit events" value={String(auditLogs.length)} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Verification review */}
              <Card className="min-w-0">
                <h2 className="text-xl font-black">Verification review</h2>
                {verifications.length === 0 ? (
                  <StatusPanel type="empty" title="All clear" message="No pending verification requests." />
                ) : (
                  <div className="mt-4 grid gap-3">
                    {verifications.map((b) => (
                      <article key={b.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                        <button
                          type="button"
                          onClick={() => toggleExpand(b.id)}
                          className="flex w-full cursor-pointer flex-wrap items-start justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400 rounded-xl"
                        >
                          <div>
                            <b>{b.business_name}</b>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {b.industry ?? "N/A"} · {b.city ?? "N/A"}
                            </p>
                          </div>
                          <Badge tone={b.verification_status === "pending" ? "amber" : "slate"}>
                            {b.verification_status === "pending" ? "Needs review" : "Draft"}
                          </Badge>
                        </button>

                        {/* Expanded document list */}
                        {expanded[b.id] && (
                          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
                            {loadingDocs[b.id] ? (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading documents...
                              </div>
                            ) : documents[b.id]?.length === 0 ? (
                              <p className="text-sm text-slate-500">No documents submitted yet.</p>
                            ) : (
                              <div className="grid gap-2">
                                {documents[b.id]?.map((doc) => (
                                  <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 dark:bg-white/5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium capitalize">
                                        {doc.document_type.replace(/_/g, " ")}
                                      </span>
                                      <Badge
                                        tone={doc.status === "approved" ? "green" : doc.status === "rejected" ? "red" : "amber"}
                                      >
                                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                      </Badge>
                                    </div>
                                    {docUrls[doc.id] ? (
                                      <a
                                        href={docUrls[doc.id]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                                      >
                                        View <ExternalLink className="h-3 w-3" />
                                      </a>
                                    ) : (
                                      <span className="text-xs text-slate-400">No preview</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Approve / Reject buttons */}
                            {b.verification_status !== "approved" && b.verification_status !== "rejected" && (
                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="primary"
                                  className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
                                  disabled={!!actionLoading[`approve-${b.id}`]}
                                  onClick={() => handleApprove(b.id, b.business_name)}
                                >
                                  {actionLoading[`approve-${b.id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  variant="secondary"
                                  className="!text-red-600 hover:!bg-red-50 dark:!text-red-400"
                                  disabled={!!actionLoading[`reject-${b.id}`]}
                                  onClick={() => handleReject(b.id, b.business_name)}
                                >
                                  {actionLoading[`reject-${b.id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </Card>

              {/* Reports */}
              <Card className="min-w-0">
                <h2 className="text-xl font-black">Recent reports</h2>
                {reports.length === 0 ? (
                  <StatusPanel type="empty" title="No reports" message="No open reports at this time." />
                ) : (
                  <div className="mt-4 grid gap-3">
                    {reports.slice(0, 10).map((r) => (
                      <article key={r.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <b>{r.reason}</b>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {r.details ?? "No details"}
                            </p>
                          </div>
                          <Badge
                            tone={r.status === "open" ? "red" : r.status === "reviewing" ? "amber" : "green"}
                          >
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </div>

                        {(r.status === "open" || r.status === "reviewing") && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="primary"
                              className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
                              disabled={!!actionLoading[`resolve-${r.id}`]}
                              onClick={() => handleResolveReport(r.id)}
                            >
                              {actionLoading[`resolve-${r.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Resolve
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={!!actionLoading[`dismiss-${r.id}`]}
                              onClick={() => handleDismissReport(r.id)}
                            >
                              {actionLoading[`dismiss-${r.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </Card>

              {/* Audit logs */}
              <Card className="min-w-0 lg:col-span-2">
                <h2 className="text-xl font-black">Audit logs</h2>
                {auditLogs.length === 0 ? (
                  <StatusPanel type="empty" title="No logs" message="No audit log entries yet." />
                ) : (
                  <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <li key={log.id} className="break-words rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/10">
                        <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                        <br />
                        {log.action}
                        {log.target_table && <> · {log.target_table}</>}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
