import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const user = await serverFetch("/api/auth/me/", cookieHeader);

  if (!user) redirect("/login");

  return <ProfileClient user={user} />;
}
