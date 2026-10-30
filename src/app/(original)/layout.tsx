import { Suspense } from "react";
import localFont from "next/font/local";
import "@/old/app/globals.css";
import "@/components/design-switch.css";
import { AuthProvider } from "@/components/auth-provider";
import { DesignSwitch } from "@/components/design-provider";
import { Toaster } from "@/old/ui/toaster";
const inter = localFont({ src: "../../old/fonts/inter-latin.woff2", display: "swap", weight: "100 900" });
export const metadata = { title: "Pawprints", description: "Start or sign a petition today." };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={inter.className}>
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <AuthProvider>{children}<Toaster /><Suspense fallback={null}><DesignSwitch oldDesign /></Suspense></AuthProvider>
  </body></html>;
}
