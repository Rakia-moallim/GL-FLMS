import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
  title: "Sign In — KOOR Mission Control",
  description: "Secure login for KOOR safety monitoring dashboard.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
