import { ArrowUpDown, ChevronLeft, ChevronRight, Link, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLibraryPreferences, type ShootSortBy } from "~/contexts/LibraryPreferencesContext";
import { useShootsQuery } from "~/lib/queries/shoots";
import { cn } from "~/lib/cn";
import { filterAndSortShoots } from "./filter-and-sort-shoots";

export const ShootSidebar = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useLibraryPreferences();
  const { data: shootsData } = useShootsQuery({ limit: 500 });
  const [search, setSearch] = useState("");

  const collapsed = preferences.view.sidebarCollapsed;
  const selectedShootId = preferences.view.sidebarShootId;
  const sortBy = preferences.view.sidebarSortBy;

  const shoots = useMemo(() => {
    const raw =
      (shootsData as { items?: { id: string; name: string; shootDate: string | Date }[] })?.items ??
      [];
    const items = raw.map((s) => ({ ...s, shootDate: new Date(s.shootDate) }));
    return filterAndSortShoots(items, { search, sortBy });
  }, [shootsData, search, sortBy]);

  const toggleCollapsed = () => {
    updatePreferences({ view: { sidebarCollapsed: !collapsed } });
  };

  const toggleSort = () => {
    const next: ShootSortBy = sortBy === "date" ? "alphabetical" : "date";
    updatePreferences({ view: { sidebarSortBy: next } });
  };

  const selectShoot = (shootId: string | null) => {
    const newId = shootId === selectedShootId ? null : shootId;
    updatePreferences({ view: { sidebarShootId: newId } });
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2 border-r border-base-300 w-10">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-1 hover:bg-base-200 rounded transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-56 border-r border-base-300 bg-base-100 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-base-300">
        <span className="text-sm font-medium">Shoots</span>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-1 hover:bg-base-200 rounded transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-2 py-2 flex items-center gap-1">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-base-content/40" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs bg-base-200 rounded border-0 outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={toggleSort}
          className="p-1 hover:bg-base-200 rounded transition-colors"
          title={sortBy === "date" ? "Sort alphabetically" : "Sort by date"}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => selectShoot("__none__")}
          className={cn(
            "w-full text-left px-3 py-1.5 text-xs hover:bg-base-200 transition-colors flex items-center gap-2",
            selectedShootId === "__none__" && "bg-primary/10 text-primary font-medium",
          )}
        >
          <span className="italic text-base-content/60">No shoot</span>
        </button>

        {shoots.map((shoot) => (
          <div
            key={shoot.id}
            className={cn(
              "flex items-center group hover:bg-base-200 transition-colors",
              selectedShootId === shoot.id && "bg-primary/10",
            )}
          >
            <button
              type="button"
              onClick={() => selectShoot(shoot.id)}
              className={cn(
                "flex-1 text-left px-3 py-1.5 text-xs truncate",
                selectedShootId === shoot.id && "text-primary font-medium",
              )}
            >
              {shoot.name}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/shoots/$shootId", params: { shootId: shoot.id } })}
              className="hidden group-hover:flex p-1 mr-1 hover:bg-base-300 rounded"
              title="Go to shoot detail"
            >
              <Link className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {selectedShootId && (
        <div className="border-t border-base-300 px-3 py-2">
          <button
            type="button"
            onClick={() => selectShoot(null)}
            className="flex items-center gap-1 text-xs text-base-content/60 hover:text-base-content transition-colors"
          >
            <X className="h-3 w-3" />
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
};
