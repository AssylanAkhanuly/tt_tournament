"use client";

import { User } from "@/lib/types";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  function handleSuccess(_user: User) {
    // Hard redirect so the Next.js server picks up the fresh auth cookie
    // that was just set by the registration API response.
    window.location.href = "/dashboard";
  }

  return <RegisterForm onSuccess={handleSuccess} />;
}
