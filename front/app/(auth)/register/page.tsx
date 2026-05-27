"use client";

import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  function handleSuccess(_user: User) {
    router.push("/dashboard");
  }

  return <RegisterForm onSuccess={handleSuccess} />;
}
