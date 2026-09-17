import { AppShell } from "@/components/app-shell";
import { logout } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const subtitle =
    session.role === "patient"
      ? "Patient"
      : session.role === "admin"
        ? "Health centre administrator"
        : session.role === "doctor"
          ? "Doctor"
          : "Nurse";

  return (
    <AppShell role={session.role} fullName={session.fullName} subtitle={subtitle} logout={logout}>
      {children}
    </AppShell>
  );
}
