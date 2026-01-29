"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BackgroundPattern } from "@/components/kontrolna-tabla/BackgroundPattern";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { SuperAdminHeader } from "./SuperAdminHeader";

interface SuperAdminShellProps {
  children: React.ReactNode;
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <BackgroundPattern />
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent
          className="fixed inset-y-0 left-0 top-0 z-50 h-full w-full max-w-xs translate-x-0 translate-y-0 rounded-none border-0 p-0 shadow-lg data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 sm:max-w-xs"
          showCloseButton={false}
          accessibleTitle="Super admin navigacija"
        >
          <SuperAdminSidebar onClose={() => setSidebarOpen(false)} />
        </DialogContent>
      </Dialog>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SuperAdminSidebar />
      </div>
      <div className="lg:pl-64">
        <SuperAdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
