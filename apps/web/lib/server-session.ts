import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, getCurrentUser, type CurrentUser } from "@/lib/api-client";

export async function requireAdmin(nextPath: string): Promise<CurrentUser> {
  const sessionCookie = (await cookies()).get("mcc_session");

  try {
    const user = await getCurrentUser(
      sessionCookie ? { cookie: `${sessionCookie.name}=${sessionCookie.value}` } : undefined,
    );

    if (user.role !== "admin") {
      redirect("/");
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/reports?next=${encodeURIComponent(nextPath)}`);
    }

    throw error;
  }
}
