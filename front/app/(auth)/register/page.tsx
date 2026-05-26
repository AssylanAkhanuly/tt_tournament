"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import { User } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();

  function handleSuccess(_user: User) {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏓 ТТ Платформа</h1>
          <p className="text-gray-500 mt-2">Создайте аккаунт</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <RegisterForm onSuccess={handleSuccess} />

          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
