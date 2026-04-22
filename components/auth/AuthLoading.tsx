'use client';
import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 z-50">
      <Loader2 className="animate-spin h-12 w-12 text-cora-600" />
    </div>
  );
}