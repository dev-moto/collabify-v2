import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { MapPin, MessageSquareText } from "lucide-react";
import { Badge, Button, Card, PublicShell, StatusPanel } from "~/components/ui";
import { getCreatorCard, type CreatorCard } from "~/services/discoverService";

export function meta() {
  return [{ title: "Creator profile | Collabify" }];
}

type LoadStatus = "loading" | "ready" | "error" | "not_found";

export default function CreatorProfile() {
  const { id } = useParams();
  const [card, setCard] = useState<CreatorCard | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setStatus("not_found");
      return;
    }

    let cancelled = false;
    const profileId = id;

    async function load() {
      setStatus("loading");
      try {
        const result = await getCreatorCard(profileId);
        if (!cancelled) {
          if (result) {
            setCard(result);
            setStatus("ready");
          } else {
            setStatus("not_found");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load creator profile.");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <PublicShell>
        <StatusPanel type="loading" title="Loading profile" message="Fetching public-safe creator showcase." />
      </PublicShell>
    );
  }

  if (status === "error") {
    return (
      <PublicShell>
        <StatusPanel type="error" title="Unable to load profile" message={errorMessage} />
      </PublicShell>
    );
  }

  if (status === "not_found" || !card) {
    return (
      <PublicShell>
        <StatusPanel type="empty" title="Creator not found" message="This public-safe profile is unavailable or has been removed." />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="max-w-6xl">
        <Link to="/discover/creators" className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
          ← Back to discovery
        </Link>

        <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-slate-950 to-violet-950 p-8 text-white">
          <Badge tone="cyan">Public creator showcase</Badge>
          <h1 className="mt-4 text-4xl font-black">{card.display_name}</h1>
          <p className="mt-2 text-cyan-100">
            <MapPin className="inline h-4 w-4" /> {card.city ?? "Philippines"} area only
          </p>
          {card.bio && <p className="mt-4 max-w-2xl text-slate-200">{card.bio}</p>}
          {card.niches.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {card.niches.map((n) => (
                <Badge key={n} tone="violet">
                  {n}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card>
            <h2 className="text-xl font-black">Niches</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.niches.length > 0 ? (
                card.niches.map((n) => (
                  <Badge key={n} tone="violet">
                    {n}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">No niches listed yet.</p>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-black">Location</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {card.city ?? "Philippines"} · city-level only
            </p>
          </Card>
          <Card>
            <h2 className="text-xl font-black">Collaboration</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Rate card and availability preferences are set within the private dashboard.
            </p>
            <Button className="mt-5" disabled type="button">
              <MessageSquareText className="h-4 w-4" /> Send message
            </Button>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
