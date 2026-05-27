import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) redirect("/login");

  let user;
  try {
    // Forward the cookie to Django when fetching on the server
    user = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me/`, {
      credentials: "include",
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    }).then((r) => {
      if (!r.ok) throw new Error("unauthorized");
      return r.json();
    });
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Image src="/logo.png" alt="SpinCoach" width={110} height={32} className="object-contain" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}
              {user.is_staff && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  Админ
                </span>
              )}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
