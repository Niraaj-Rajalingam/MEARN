import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MuiThemeProvider from "./components/MuiThemeProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { getSession } from "@/lib/session";
import { getOrCreateThemePreferences } from "./services/theme.service";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "MEARN Tasks",
  description: "Manage your tasks and groups efficiently",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to get user session and their theme preferences
  let initialThemeMode: 'light' | 'dark' | 'system' = 'light';
  let initialAccentColor: 'indigo' | 'pink' | 'orange' | 'green' | 'purple' | 'blue' | 'red' | 'teal' = 'indigo';

  try {
    const session = await getSession();
    if (session) {
      const preferences = await getOrCreateThemePreferences(session.user_uuid);
      initialThemeMode = preferences.theme_mode;
      initialAccentColor = preferences.accent_color;
    }
  } catch (error) {
    // If there's an error, just use defaults
    console.log('Could not load theme preferences, using defaults');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          initialThemeMode={initialThemeMode}
          initialAccentColor={initialAccentColor}
        >
          <MuiThemeProvider>
            {children}
          </MuiThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
