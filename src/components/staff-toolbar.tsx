import { Link, useRouterState } from "@tanstack/react-router";
import { Archive, LayoutDashboard } from "lucide-react";

const staffLinks = [
  { to: "/admin" as const, label: "Dashboard Admin", icon: LayoutDashboard },
  { to: "/hr" as const, label: "Bank Data HC", icon: Archive },
];

export function StaffToolbar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label="Navigasi admin"
      className="mt-5 flex w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1.5 sm:w-fit"
    >
      {staffLinks.map((item, index) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <div key={item.to} className="contents">
            {index > 0 ? <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" /> : null}
            <Link
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-admin-primary px-5 py-2.5 font-admin text-sm font-bold text-admin-primary-foreground shadow-panel transition-colors sm:flex-none"
                  : "group flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-5 py-2.5 font-admin text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-admin-accent sm:flex-none"
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}