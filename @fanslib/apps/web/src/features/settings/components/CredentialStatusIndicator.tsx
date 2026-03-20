import { AlertTriangle, CheckCircle, Clock, ExternalLink, XCircle } from "lucide-react";
import { useFanslyCredentialStatusQuery } from "~/lib/queries/settings";

const formatAge = (lastUpdated: number | null): string => {
  if (!lastUpdated) return "Never";
  const diffMs = Date.now() - lastUpdated;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Less than an hour ago";
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
};

const statusConfig = {
  green: {
    icon: CheckCircle,
    iconClass: "text-success",
    borderClass: "border-success/30",
    label: "Credentials Active",
    description: "Analytics data is being fetched normally.",
  },
  yellow: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    borderClass: "border-warning/30",
    label: "Credentials Aging",
    description: "Credentials may expire soon. Browse Fansly to refresh them.",
  },
  red: {
    icon: XCircle,
    iconClass: "text-error",
    borderClass: "border-error/30",
    label: "Credentials Expired",
    description: "Analytics fetching is halted.",
  },
} as const;

export const CredentialStatusIndicator = () => {
  const { data, isLoading } = useFanslyCredentialStatusQuery();

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border p-4 border-base-300 bg-base-200 animate-pulse h-20" />
    );
  }

  const status = data.status as keyof typeof statusConfig;
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 bg-base-200 ${config.borderClass}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-1">{config.label}</div>
          <div className="text-xs text-base-content/60">{config.description}</div>
          <div className="text-xs text-base-content/50 flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            <span>Last refreshed: {formatAge(data.lastUpdated)}</span>
          </div>
          {status === "red" && (
            <a
              href="https://fansly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              Open Fansly to refresh credentials
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
