import { getSessionUser, json } from "@/lib/auth";
import { loadBootstrap } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  return json(await loadBootstrap(user));
}
