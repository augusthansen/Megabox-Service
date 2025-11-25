import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function Home() {
  // Check if user is logged in
  const session = await getSession();

  if (session) {
    // If logged in, redirect to admin dashboard
    redirect("/admin");
  } else {
    // If not logged in, redirect to login page
    redirect("/login");
  }
}
