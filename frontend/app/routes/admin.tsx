import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Flag,
  Loader2,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
  XCircle,
  UserX,
  UserCheck,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { AppShell, Badge, Button, Card, ProtectedRoute, Stat, StatusPanel, SearchBox } from "~/components/ui";
import {
  listPendingVerifications,
  listAuditLogs,
  listReports,
  updateVerificationStatus,
  listVerificationDocuments,
  updateReportStatus,
  recordAdminAction,
  getDashboardStats,
  listUsers,
  suspendUser,
  activateUser,
  type VerificationItem,
  type AuditLogEntry,
  type Report,
  type AdminUser,
  type DashboardStats,
} from "~/services/adminService";
import type { VerificationDocument } from "~/services/verificationService";
import { getDocumentUrl } from "~/services/verificationService";

export function meta() {
  return [{ title: "Admin | Collabify" }];
}

type TabId = "dashboard" | "verifications" | "reports" | "users" | "audit";

type ExpandedState = Record<string, boolean>;
type DocMap = Record<string, VerificationDocument[]>;
type DocUrlMap = Record<string, string>;

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "users", label: "Users", icon: Users },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
];

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
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Verifications
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [documents, setDocuments] = useState<DocMap>({});
  const [docUrls, setDocUrls] = useState<DocUrlMap>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});

  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [reportFilter, setReportFilter] = useState<string>("open");

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Shared state
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setStatus("loading");
    try {
      const [statsData, v, a, r] = await Promise.all([
        getDashboardStats(),
        listPendingVerifications(),
        listAuditLogs(),
        listReports("open"),
      ]);
      setStats(statsData);
      setVerifications(v);
      setAuditLogs(a);
      setReports(r);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
      setStatus("error");
    }
  }

  async function loadUsers(query?: string) {
    try {
      const data = await listUsers(query);
      setUsers(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load users.");
    }
  }

  // Load users when tab switches to "users"
  useEffect(() => {
    if (activeTab === "users") {
      loadUsers(userSearch || undefined);
    }
  }, [activeTab]);

  // Debounced user search
  useEffect(() => {
    if (activeTab !== "users") return;
    const timer = setTimeout(() => {
      loadUsers(userSearch || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, activeTab]);

  // Load reports when filter changes
  useEffect(() => {
    if (activeTab !== "reports") return;
    (async () => {
      try {
        const data = await listReports(reportFilter);
        setReports(data);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to load reports.");
      }
    })();
  }, [reportFilter, activeTab]);

  const toggleExpand = useCallback(async (businessId: string) => {
    setExpanded((prev) => {
      const next = { ...prev };
      if (next[businessId]) {
        delete next[businessId];
      } else {
        next[businessId] = true;
      }
      return next;
    });

    if (!expanded[businessId] && !documents[businessId]) {
      setLoadingDocs((prev) => ({ ...prev, [businessId]: true }));
      try {
        const docs = await listVerificationDocuments(businessId);
        setDocuments((prev) => ({ ...prev, [businessId]: docs }));
        const urls = await loadDocumentUrls(docs);
        setDocUrls((prev) => ({ ...prev, ...urls }));
      } catch {
        // Silently fail
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
      const data = await listReports(reportFilter);
      setReports(data);
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
      const data = await listReports(reportFilter);
      setReports(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to dismiss report.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`dismiss-${reportId}`]: false }));
    }
  }

  async function handleSuspendUser(userId: string, userName: string) {
    setActionLoading((prev) => ({ ...prev, [`suspend-${userId}`]: true }));
    setActionError("");
    try {
      await suspendUser(userId);
      await recordAdminAction(`Suspended user ${userName}`, { user_id: userId }, userId);
      await loadUsers(userSearch || undefined);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to suspend user.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`suspend-${userId}`]: false }));
    }
  }

  async function handleActivateUser(userId: string, userName: string) {
    setActionLoading((prev) => ({ ...prev, [`activate-${userId}`]: true }));
    setActionError("");
    try {
      await activateUser(userId);
      await recordAdminAction(`Activated user ${userName}`, { user_id: userId }, userId);
      await loadUsers(userSearch || undefined);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to activate user.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`activate-${userId}`]: false }));
    }
  }

  function renderTabNav() {
    return (
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Admin sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    );
  }

  function renderDashboard() {
    if (!stats) return null;
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat icon={Users} label="Total users" value={String(stats.total_users)} />
        <Stat icon={Users} label="Creators" value={String(stats.total_creators)} />
        <Stat icon={Users} label="Businesses" value={String(stats.total_businesses)} />
        <Stat icon={UserX} label="Suspended" value={String(stats.total_suspended)} />
        <Stat icon={ShieldCheck} label="Pending verifications" value={String(stats.pending_verifications)} />
        <Stat icon={Flag} label="Open reports" value={String(stats.open_reports)} />
      </div>
    );
  }

  function renderVerifications() {
    return (
      <>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Verification review</h2>
          <Badge tone="cyan">{verifications.length} pending</Badge>
        </div>
        {verifications.length === 0 ? (
          <StatusPanel type="empty" title="All clear" message="No pending verification requests." />
        ) : (
          <div className="grid gap-3">
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
      </>
    );
  }

  function renderReports() {
    return (
      <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Reports</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "open", label: "Open" },
              { value: "resolved", label: "Resolved" },
              { value: "dismissed", label: "Dismissed" },
              { value: "", label: "All" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReportFilter(opt.value)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  reportFilter === opt.value
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {reports.length === 0 ? (
          <StatusPanel type="empty" title="No reports" message="No reports match the current filter." />
        ) : (
          <div className="grid gap-3">
            {reports.map((r) => (
              <article key={r.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{r.reason}</b>
                      <Badge tone={r.status === "open" ? "red" : r.status === "reviewing" ? "amber" : "green"}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {r.details ?? "No details"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Reported by: {r.reporter_id.slice(0, 8)}… · 
                      Target: {r.reported_user_id ? `${r.reported_user_id.slice(0, 8)}…` : "Not specified"} ·
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
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
      </>
    );
  }

  function renderUsers() {
    return (
      <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">User management</h2>
          <SearchBox
            placeholder="Search users by name..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
        {users.length === 0 ? (
          <StatusPanel type="empty" title="No users" message={userSearch ? "No users match your search." : "No users found."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-500 dark:border-white/10">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">City</th>
                  <th className="pb-3 pr-4">Admin</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-3 pr-4 font-medium">{u.display_name}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={u.role === "creator" ? "violet" : "cyan"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={u.status === "active" ? "green" : u.status === "suspended" ? "red" : "slate"}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{u.city ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {u.is_admin ? (
                        <Badge tone="amber">Admin</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      {u.status === "active" ? (
                        <Button
                          variant="secondary"
                          disabled={!!actionLoading[`suspend-${u.id}`]}
                          onClick={() => handleSuspendUser(u.id, u.display_name)}
                          className="!text-red-600 !text-xs !px-3 !py-1.5"
                        >
                          {actionLoading[`suspend-${u.id}`] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          Suspend
                        </Button>
                      ) : u.status === "suspended" ? (
                        <Button
                          variant="secondary"
                          disabled={!!actionLoading[`activate-${u.id}`]}
                          onClick={() => handleActivateUser(u.id, u.display_name)}
                          className="!text-emerald-600 !text-xs !px-3 !py-1.5"
                        >
                          {actionLoading[`activate-${u.id}`] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                          Activate
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Deleted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }

  function renderAuditLogs() {
    return (
      <>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Audit logs</h2>
          <Badge tone="cyan">{auditLogs.length} events</Badge>
        </div>
        {auditLogs.length === 0 ? (
          <StatusPanel type="empty" title="No logs" message="No audit log entries yet." />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/10">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{log.action}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                {log.target_table && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Target: {log.target_table}{log.target_id ? ` #${log.target_id.slice(0, 8)}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell role="admin" title="Admin dashboard" description="Manage users, review verifications, moderate reports, and monitor activity.">
        {status === "loading" && <StatusPanel type="loading" title="Loading admin panel" message="Please wait while we load data." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
        {status === "success" && (
          <>
            {actionError && (
              <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300" role="alert">
                {actionError}
              </div>
            )}

            {renderTabNav()}

            <Card>
              {activeTab === "dashboard" && renderDashboard()}
              {activeTab === "verifications" && renderVerifications()}
              {activeTab === "reports" && renderReports()}
              {activeTab === "users" && renderUsers()}
              {activeTab === "audit" && renderAuditLogs()}
            </Card>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
