import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AppShell, Badge, Button, Card, ProtectedRoute, SearchBox, StatusPanel, VerifiedMark } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import { listBusinessCards, type BusinessCard } from "~/services/discoverService";

export function meta() {
  return [{ title: "Discover businesses | Collabify" }];
}

type Status = "loading" | "ready" | "error";
type Filters = { query: string };

export default function DiscoverBusinesses() {
  const sessionStatus = useAppSelector((state) => state.session.status);
  const profileStatus = useAppSelector((state) => state.session.profileStatus);
  const profile = useAppSelector((state) => state.session.profile);
  const role = profile?.role === "creator" ? "creator" : "business";

  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  useEffect(() => {
    if (sessionStatus !== "authenticated" || profileStatus !== "ready" || profile?.role !== "creator") return;

    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const businessCards = await listBusinessCards({
          query: appliedQuery || undefined,
        });
        if (!cancelled) {
          setCards(businessCards);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load business profiles.");
          setStatus("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sessionStatus, profileStatus, profile?.role, appliedQuery]);

  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <AppShell role={role} title="Discover businesses" description="Review brands and businesses interested in creator collaborations.">
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <SearchBox
            placeholder="Search businesses or industries"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <Button type="button" onClick={() => setAppliedQuery(query)} disabled={status === "loading"}>
            Search
          </Button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {status === "loading" && (
            <div className="md:col-span-3">
              <StatusPanel type="loading" title="Loading businesses" message="Fetching public-safe business profiles." />
            </div>
          )}
          {status === "error" && (
            <div className="md:col-span-3">
              <StatusPanel type="error" title="Unable to load businesses" message={errorMessage} />
            </div>
          )}
          {status === "ready" && cards.length === 0 && (
            <div className="md:col-span-3">
              <StatusPanel type="empty" title="No businesses found" message="Try a different search term or check back later." />
            </div>
          )}
          {status === "ready" && cards.map((b) => (
            <Card key={b.id}>
              <div className="flex items-center justify-between gap-3">
                <Badge tone="cyan">{b.industry ?? "General"}</Badge>
                {b.verification_status === "approved" ? (
                  <VerifiedMark />
                ) : (
                  <Badge tone="amber">Pending</Badge>
                )}
              </div>
              <h2 className="mt-4 text-xl font-black">{b.business_name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{b.city} area</p>
              <Link
                className="mt-5 inline-flex font-bold text-cyan-700 dark:text-cyan-300"
                to={`/businesses/${b.id}`}
              >
                View profile
              </Link>
            </Card>
          ))}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
