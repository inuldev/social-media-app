import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

import localFont from "next/font/local";

import "./globals.css";
import AuthWrapper from "./auth-wrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "inbook",
  description: "inbook is a web app like facebook",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster
          toastOptions={{
            // Default styles
            style: {
              borderRadius: "8px",
              background: "#333",
              color: "#fff",
            },
            // Default duration
            duration: 3000,
            // Success toast style
            success: {
              duration: 3000,
              style: {
                background: "green",
                color: "white",
              },
            },
            // Error toast style
            error: {
              duration: 4000,
              style: {
                background: "#FF4B4B",
                color: "white",
              },
            },
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthWrapper>{children}</AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
