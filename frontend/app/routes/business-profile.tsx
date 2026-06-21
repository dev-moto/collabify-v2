import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Building2, Mail, MapPin } from "lucide-react";
import { Badge, Button, Card, PublicShell, StatusPanel, VerifiedMark } from "~/components/ui";
import { getBusinessCard, type BusinessCard } from "~/services/discoverService";

export function meta() {
  return [{ title: "Business profile | Collabify" }];
}

type LoadStatus = "loading" | "ready" | "error" | "not_found";

export default function BusinessProfile() {
  const { id } = useParams();
  const [card, setCard] = useState<BusinessCard | null>(null);
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
        const result = await getBusinessCard(profileId);
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
          setErrorMessage(error instanceof Error ? error.message : "Unable to load business profile.");
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
        <StatusPanel type="loading" title="Loading profile" message="Fetching public-safe business profile." />
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
        <StatusPanel type="empty" title="Business not found" message="This profile is unavailable or has been removed." />
      </PublicShell>
    );
  }

  const isVerified = card.verification_status === "approved";

  return (
    <PublicShell>
      <div className="max-w-5xl">
        <Link to="/discover/businesses" className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
          ← Back to businesses
        </Link>

        <Card className="mt-6">
          <Building2 className="h-10 w-10 text-cyan-500" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-black">{card.business_name}</h1>
            {isVerified ? (
              <VerifiedMark />
            ) : (
              <Badge tone="amber">Verification pending</Badge>
            )}
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            <MapPin className="inline h-4 w-4" /> {card.city} area · {card.industry ?? "General"}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="cyan">{card.industry ?? "General"}</Badge>
          </div>
          <Button className="mt-8" disabled={!isVerified} type="button">
            <Mail className="h-4 w-4" /> Contact business
          </Button>
          {!isVerified && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Contact options unlock after verification under Supabase policies.
            </p>
          )}
        </Card>
      </div>
    </PublicShell>
  );
}
