import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppShell({ children, isStaff }: { children: ReactNode; isStaff?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
          <Link to={isStaff ? "/" : "/dashboard"} className="flex items-center">
            <DoverLogo className="h-11 w-auto" />
          </Link>
          <div className="flex flex-1">
            <span className="px-3 text-sm font-medium text-muted-foreground">
              {isStaff ? "Area Admin" : "Area Kandidat"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Keluar
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
