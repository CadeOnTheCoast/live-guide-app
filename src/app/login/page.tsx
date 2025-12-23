import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="text-sm text-muted-foreground">Loading sign-in form...</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
