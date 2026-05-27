"use client";

import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(_user: User) {
    router.push("/dashboard");
  }

  return <LoginForm onSuccess={handleSuccess} />;
}
