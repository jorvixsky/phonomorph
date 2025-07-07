"use client";

import "@/app/globals.css";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import Header from "@/components/common/header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <WagmiProvider config={wagmiConfig}>
        <Header />
        {children}
      </WagmiProvider>
    </div>
  );
}
