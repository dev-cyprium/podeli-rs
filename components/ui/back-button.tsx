"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#f0a202]"
    >
      <ArrowLeft className="h-4 w-4" />
      Nazad
    </button>
  );
}
