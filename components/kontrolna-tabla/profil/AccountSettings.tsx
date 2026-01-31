"use client";

import { useUser } from "@clerk/nextjs";
import { ArrowLeft, User, Mail, Lock, Link2, Monitor, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ProfileSection } from "./ProfileSection";
import { EmailSection } from "./EmailSection";
import { PasswordSection } from "./PasswordSection";
import { ConnectedAccountsSection } from "./ConnectedAccountsSection";
import { SessionsSection } from "./SessionsSection";
import { DeleteAccountSection } from "./DeleteAccountSection";

export function AccountSettings() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Morate biti prijavljeni da pristupite ovoj stranici.</p>
        <Button asChild>
          <Link href="/sign-in">Prijavi se</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Logo */}
      <div className="mb-2">
        <Logo href="/" height={28} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kontrolna-tabla">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-podeli-dark">Podešavanja naloga</h1>
          <p className="text-sm text-muted-foreground">
            Upravljajte svojim profilom i sigurnosnim podešavanjima
          </p>
        </div>
      </div>

      {/* Desktop: Vertical tabs layout */}
      <div className="hidden md:block">
        <Tabs defaultValue="profile" orientation="vertical" className="flex gap-6">
          <TabsList variant="line" className="w-56 shrink-0 flex-col items-start border-r pr-4">
            <TabsTrigger value="profile" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="email" className="w-full justify-start gap-2">
              <Mail className="h-4 w-4" />
              Email adrese
            </TabsTrigger>
            <TabsTrigger value="password" className="w-full justify-start gap-2">
              <Lock className="h-4 w-4" />
              Lozinka
            </TabsTrigger>
            <TabsTrigger value="connected" className="w-full justify-start gap-2">
              <Link2 className="h-4 w-4" />
              Povezani nalozi
            </TabsTrigger>
            <TabsTrigger value="sessions" className="w-full justify-start gap-2">
              <Monitor className="h-4 w-4" />
              Aktivne sesije
            </TabsTrigger>
            <TabsTrigger value="danger" className="w-full justify-start gap-2 text-podeli-red data-[state=active]:text-podeli-red">
              <AlertTriangle className="h-4 w-4" />
              Opasna zona
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0">
            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>
            <TabsContent value="email">
              <EmailSection />
            </TabsContent>
            <TabsContent value="password">
              <PasswordSection />
            </TabsContent>
            <TabsContent value="connected">
              <ConnectedAccountsSection />
            </TabsContent>
            <TabsContent value="sessions">
              <SessionsSection />
            </TabsContent>
            <TabsContent value="danger">
              <DeleteAccountSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Mobile: Stacked sections */}
      <div className="space-y-6 md:hidden">
        <ProfileSection />
        <EmailSection />
        <PasswordSection />
        <ConnectedAccountsSection />
        <SessionsSection />
        <DeleteAccountSection />
      </div>
    </div>
  );
}
