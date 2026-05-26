"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(_user: User) {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏓 ТТ Платформа</h1>
          <p className="text-gray-500 mt-2">Войдите в свой аккаунт</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <LoginForm onSuccess={handleSuccess} />

          <p className="text-center text-sm text-gray-500 mt-6">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
