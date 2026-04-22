'use client';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthError({ 
  error 
}: { 
  error: string | undefined 
}) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}