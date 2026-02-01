import type { ShootSummary, ShootSummarySchema } from '@fanslib/server/schemas';
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { ShootHeader } from "./ShootHeader";


type ShootDetailProps = {
  shoot: ShootSummary;
  groupedMedia: Map<string, unknown[]>;
  onUpdate: () => void;
};

export const ShootDetail: FC<ShootDetailProps> = ({ shoot }) => (
  <Link to="/shoots/$shootId" params={{ shootId: shoot.id }}>
    <Card className="overflow-hidden border-base-content cursor-pointer">
      <CardBody className="p-0">
        <div className="px-4 py-3">
          <ShootHeader
            shoot={shoot}
            isEditing={false}
            onUpdate={async () => {}}
            onCancel={() => {}}
          />
        </div>
      </CardBody>
    </Card>
  </Link>
);
