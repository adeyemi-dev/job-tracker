import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmModal";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300 pb-16 sm:pb-0">
        <Providers>
          <ToastProvider>
            <ConfirmProvider>
              <AppShell>{children}</AppShell>
              <BottomNav />
            </ConfirmProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
