import {
  CheckCircle2Icon,
  CircleDotIcon,
  HelpCircleIcon,
  SearchIcon,
  ShieldXIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "~/lib/cn";
import { VERIFICATION_STATUS_COLORS } from "~/lib/colors";

export const VERIFICATION_STATUS = {
  UNKNOWN: 'UNKNOWN',
  NOT_NEEDED: 'NOT_NEEDED',
  NEEDED: 'NEEDED',
  APPLIED: 'APPLIED',
  REJECTED: 'REJECTED',
  VERIFIED: 'VERIFIED',
} as const;

export type VerificationStatusType = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

type VerificationStatusProps = {
  status: VerificationStatusType;
  className?: string;
};

const VERIFICATION_STATUS_MAP = {
  [VERIFICATION_STATUS.NOT_NEEDED]: "Not Needed",
  [VERIFICATION_STATUS.VERIFIED]: "Verified",
  [VERIFICATION_STATUS.NEEDED]: "Needed",
  [VERIFICATION_STATUS.APPLIED]: "Applied",
  [VERIFICATION_STATUS.REJECTED]: "Rejected",
  [VERIFICATION_STATUS.UNKNOWN]: "Unknown",
} as const;

const verificationStatusIconMap = {
  [VERIFICATION_STATUS.NOT_NEEDED]: CircleDotIcon,
  [VERIFICATION_STATUS.VERIFIED]: CheckCircle2Icon,
  [VERIFICATION_STATUS.NEEDED]: XCircleIcon,
  [VERIFICATION_STATUS.APPLIED]: SearchIcon,
  [VERIFICATION_STATUS.REJECTED]: ShieldXIcon,
  [VERIFICATION_STATUS.UNKNOWN]: HelpCircleIcon,
};

const VerificationStatusIcon = ({ status }: { status: VerificationStatusType }) => {
  const Icon = verificationStatusIconMap[status];
  return Icon ? <Icon className="w-4 h-4" /> : null;
};

export const VerificationStatus = ({ status, className }: VerificationStatusProps) => {
  const colors = VERIFICATION_STATUS_COLORS[status];

  return (
    <div
      className={cn("flex items-center gap-1 text-sm", className)}
      style={colors ? { color: colors.foreground } : undefined}
    >
      <VerificationStatusIcon status={status} />
      <span>{VERIFICATION_STATUS_MAP[status]}</span>
    </div>
  );
};
