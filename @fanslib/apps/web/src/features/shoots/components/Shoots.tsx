import type { FC } from "react";
import { ShootPreferencesProvider } from "~/contexts/ShootPreferencesContext";
import { ShootsContent } from "./ShootsContent";

type ShootsProps = {
  className?: string;
};

export const Shoots: FC<ShootsProps> = (props) => (
  <ShootPreferencesProvider>
    <ShootsContent {...props} />
  </ShootPreferencesProvider>
);
