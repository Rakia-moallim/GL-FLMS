import type { Metadata } from "next";
import ThemeProvider from "../components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOOR Mission Control",
  description: "Premium real-time IoT safety monitoring dashboard for gas leakage and flame detection. Powered by ESP32 and Firebase.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

