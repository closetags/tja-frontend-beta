import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Management Admin",
  description: "Manage events, guests, check-ins, and souvenirs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="antialiased font-sans"
      >
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
