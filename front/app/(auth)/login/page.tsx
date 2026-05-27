"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/lib/types";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(_user: User) {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#163535]">
      <LoginForm onSuccess={handleSuccess} />

      {/* Footer link */}
      <p className="text-center text-sm text-white/40 pb-8">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-[#0dcfcf] hover:underline font-medium">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
