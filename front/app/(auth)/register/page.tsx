"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/lib/types";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  function handleSuccess(_user: User) {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#163535]">
      <RegisterForm onSuccess={handleSuccess} />

      {/* Footer link — shown below the form */}
      <p className="text-center text-sm text-white/40 pb-8 -mt-4">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-[#0dcfcf] hover:underline font-medium">
          Войти
        </Link>
      </p>
    </div>
  );
}
