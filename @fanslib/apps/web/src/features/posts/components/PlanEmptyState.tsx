import { useNavigate } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { EmptyState } from "~/components/ui/EmptyState";

export const PlanEmptyState = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<Calendar className="h-12 w-12" />}
      title="No channels configured"
      description="You don't have any channels to post your content to yet."
      action={{
        label: "Add Channel",
        onClick: () => {
          navigate({ to: "/content/channels" });
        },
      }}
    />
  );
};

