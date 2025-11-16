import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { SfwModeSettings } from "~/features/settings/components/SfwModeSettings";

const ContentSafetySettings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <Shield /> Content Safety
      </h1>
      <p className="text-base-content/60">Control content visibility and filtering options</p>
    </div>

    <div className="space-y-2">
      <SfwModeSettings />
    </div>
  </div>
);

export const Route = createFileRoute("/settings/content-safety")({
  component: ContentSafetySettings,
});
