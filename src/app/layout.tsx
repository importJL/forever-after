import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AmplifySessionProvider } from "@/lib/amplify-session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ForeverAfter — Wedding Planner",
  description: "Your all-in-one wedding planning companion. Plan, budget, organize, and manage every detail of your special day.",
  keywords: ["wedding", "planner", "budget", "guests", "timeline", "wedding planning"],
  icons: {
    icon: '/logo2.png',
  },
  openGraph: {
    title: "ForeverAfter — Wedding Planner",
    description: "Your all-in-one wedding planning companion",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AmplifySessionProvider>
            {children}
          </AmplifySessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}