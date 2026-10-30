import type { Metadata } from "next";
import { Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "@/components/design-switch.css";
import { DesignSwitch } from "@/components/design-provider";
import { AuthProvider } from "@/components/auth-provider";
import SiteHeader, { HeaderFallback } from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import WorkspaceShell, { WorkspaceLoading } from "@/components/workspace-shell";

export const metadata: Metadata = {
  title: {
    default: "Pawprints · Your voice. Our campus.",
    template: "%s | Pawprints",
  },
  description:
    "Make your mark at RIT. Discover campus petitions, add your signature, and follow responses from Student Government.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a className="visually-hidden-focusable skip-link" href="#main-content">
          Skip to main content
        </a>
          <AuthProvider>
            <Suspense fallback={<HeaderFallback />}>
              <SiteHeader />
            </Suspense>
            <Suspense fallback={<WorkspaceLoading />}>
              <WorkspaceShell>{children}</WorkspaceShell>
            </Suspense>
            <SiteFooter />
            <DesignSwitch />
          </AuthProvider>
      </body>
    </html>
  );
}
