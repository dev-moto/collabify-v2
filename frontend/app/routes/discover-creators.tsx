import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AppShell, Badge, Button, Card, ProtectedRoute, SearchBox, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import { listCreatorCards, listCities, type CreatorCard } from "~/services/discoverService";

export function meta() {
  return [{ title: "Discover creators | Collabify" }];
}

type Status = "loading" | "ready" | "error";
type Filters = { city: string; query: string };

export default function DiscoverCreators() {
  const sessionStatus = useAppSelector((state) => state.session.status);
  const profileStatus = useAppSelector((state) => state.session.profileStatus);
  const profile = useAppSelector((state) => state.session.profile);
  const role = profile?.role === "business" ? "business" : "creator";

  const [cards, setCards] = useState<CreatorCard[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState<Filters>({ city: "", query: "" });
  const [applied, setApplied] = useState<Filters>({ city: "", query: "" });

  useEffect(() => {
    if (sessionStatus !== "authenticated" || profileStatus !== "ready" || profile?.role !== "business") return;

    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const [creatorCards, availableCities] = await Promise.all([
          listCreatorCards({
            city: applied.city || undefined,
            query: applied.query || undefined,
          }),
          listCities(),
        ]);
        if (!cancelled) {
          setCards(creatorCards);
          setCities(availableCities);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load creator profiles.");
          setStatus("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sessionStatus, profileStatus, profile?.role, applied]);

  function applyFilters() {
    setApplied({ ...filters });
  }

  return (
    <ProtectedRoute allowedRoles={["business"]}>
      <AppShell role={role} title="Discover creators" description="Browse public-safe creator profiles by city, niche, and availability.">
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <SearchBox
            placeholder="Search creators, niches, or city"
            value={filters.query}
            onChange={(e) => {
              const value = e.currentTarget?.value ?? "";
              setFilters((prev) => ({ ...prev, query: value }));
            }}
          />
          <select
            aria-label="Filter by city"
            value={filters.city}
            onChange={(e) => {
              const value = e.currentTarget?.value ?? "";
              setFilters((prev) => ({ ...prev, city: value }));
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10"
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <Button type="button" onClick={applyFilters} disabled={status === "loading"}>
            Apply filters
          </Button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {status === "loading" && (
            <div className="md:col-span-3">
              <StatusPanel type="loading" title="Loading creators" message="Fetching public-safe profiles from discover view." />
            </div>
          )}
          {status === "error" && (
            <div className="md:col-span-3">
              <StatusPanel type="error" title="Unable to load creators" message={errorMessage} />
            </div>
          )}
          {status === "ready" && cards.length === 0 && (
            <div className="md:col-span-3">
              <StatusPanel type="empty" title="No creators found" message="Try fewer filters or a nearby city." />
            </div>
          )}
          {status === "ready" && cards.map((c) => (
            <Card key={c.id}>
              <Badge tone="green">Public fields only</Badge>
              <h2 className="mt-4 text-xl font-black">{c.display_name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{c.city} area</p>
              {c.niches.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.niches.map((n) => <Badge key={n} tone="violet">{n}</Badge>)}
                </div>
              )}
              {c.bio && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{c.bio}</p>}
              <Link
                className="mt-5 inline-flex font-bold text-cyan-700 dark:text-cyan-300"
                to={`/creators/${c.id}`}
              >
                View showcase
              </Link>
            </Card>
          ))}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
