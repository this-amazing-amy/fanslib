import { AlertTriangle, CheckCircle, Clock, ExternalLink, XCircle } from "lucide-react";
import { useFanslyCredentialStatusQuery } from "~/lib/queries/settings";
import { Tooltip } from "~/components/ui/Tooltip";

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
    dotClass: "bg-success",
    iconClass: "text-success",
    label: "Credentials Active",
    description: "Analytics data is being fetched normally.",
  },
  yellow: {
    icon: AlertTriangle,
    dotClass: "bg-warning",
    iconClass: "text-warning",
    label: "Credentials Aging",
    description: "Credentials may expire soon. Browse Fansly to refresh them.",
  },
  red: {
    icon: XCircle,
    dotClass: "bg-error",
    iconClass: "text-error",
    label: "Credentials Expired",
    description: "Analytics fetching is halted.",
  },
} as const;

const TooltipContent = ({
  config,
  status,
  lastUpdated,
}: {
  config: (typeof statusConfig)[keyof typeof statusConfig];
  status: string;
  lastUpdated: number | null;
}) => {
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-1.5 py-0.5 max-w-56">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconClass}`} />
        <span className="font-medium">{config.label}</span>
      </div>
      <div className="text-base-content/60">{config.description}</div>
      <div className="text-base-content/50 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Last refreshed: {formatAge(lastUpdated)}</span>
      </div>
      {status === "red" && (
        <a
          href="https://fansly.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Open Fansly to refresh
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export const CredentialStatusBadge = () => {
  const { data, isLoading } = useFanslyCredentialStatusQuery();

  if (isLoading || !data) return null;

  const status = data.status as keyof typeof statusConfig;
  const config = statusConfig[status];

  return (
    <Tooltip
      content={
        <TooltipContent config={config} status={status} lastUpdated={data.lastUpdated} />
      }
      placement="bottom"
    >
      <button
        type="button"
        className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-base-300 transition-colors"
        aria-label={`Credential status: ${config.label}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
      </button>
    </Tooltip>
  );
};
