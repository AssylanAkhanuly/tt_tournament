"use client";

import { User } from "@/lib/types";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  function handleSuccess(_user: User) {
    // Hard redirect so the Next.js server picks up the fresh auth cookie.
    window.location.href = "/dashboard";
  }

  return <LoginForm onSuccess={handleSuccess} />;
}
