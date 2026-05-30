import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-auth";
import MyTournamentsClient from "./MyTournamentsClient";

export default async function MyTournamentsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const [user, tournaments] = await Promise.all([
    serverFetch("/api/auth/me/", cookieHeader),
    serverFetch("/api/tournaments/my/", cookieHeader),
  ]);

  if (!user) redirect("/login");

  return <MyTournamentsClient tournaments={tournaments ?? []} />;
}
