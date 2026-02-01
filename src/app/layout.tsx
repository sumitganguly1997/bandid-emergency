import type { Metadata } from "next";
import "./globals.css";
import DevModeWrapper from "./components/DevModeWrapper";

export const metadata: Metadata = {
  title: "BandID - Smart Wearable Identification",
  description: "Emergency identification and contact management through smart wristbands",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
          {children}
        </div>
        <DevModeWrapper />
      </body>
    </html>
  );
}
