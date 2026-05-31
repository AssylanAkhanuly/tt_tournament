import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, Zap, Volume2 } from "lucide-react";
import SpinCoachLogo from "@/components/SpinCoachLogo";

// Landing page (Russian by default). Logged-in users skip straight to the app.
export default async function RootPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("access_token")) redirect("/dashboard");

  const features = [
    { Icon: Zap, title: "Живой счёт", desc: "Результаты и сетка обновляются мгновенно у всех участников." },
    { Icon: Trophy, title: "Группы и плей-офф", desc: "Олимпийская система или групповой этап с выходом в плей-офф." },
    { Icon: Volume2, title: "Голосовые вызовы", desc: "Игроки автоматически вызываются к свободным столам по имени." },
  ];

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <SpinCoachLogo size="md" variant="dark" />
        <Link href="/login"
          className="text-[14px] font-semibold text-white/70 hover:text-white transition-colors">
          Войти
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-300
                           bg-blue-500/15 border border-blue-500/25 px-3 py-1 rounded-full">
            🏓 Настольный теннис
          </span>
          <h1 className="text-[38px] sm:text-[56px] font-black text-white leading-[1.05] tracking-tight mt-5">
            Турниры без хаоса —{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              от записи до финала
            </span>
          </h1>
          <p className="text-[16px] sm:text-[18px] text-white/55 mt-5 leading-relaxed">
            Создавайте турниры, ведите счёт в реальном времени, автоматически назначайте
            столы и вызывайте игроков голосом — всё в одном приложении.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-[16px] font-bold text-white
                         bg-blue-600 hover:bg-blue-500 transition-all active:scale-[.98]
                         shadow-[0_8px_28px_rgba(37,99,235,0.45)]">
              Зарегистрироваться
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-[16px] font-bold text-white/80
                         border border-white/[0.12] hover:bg-white/[0.05] transition-all active:scale-[.98]">
              Войти
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-3xl">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/[0.08] p-5 text-left"
                 style={{ background: "var(--card)" }}>
              <Icon size={20} className="text-blue-400" />
              <p className="text-[15px] font-bold text-white mt-3">{title}</p>
              <p className="text-[13px] text-white/45 mt-1 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-[12px] text-white/25">
        SpinCoach · Турниры по настольному теннису
      </footer>
    </main>
  );
}
