import { participantCount } from "../server/profiles.js";
import { supabaseFromEnv } from "../server/supabase.js";

export async function GET(): Promise<Response> {
  try {
    return Response.json(
      { people: await participantCount(supabaseFromEnv()) },
      { headers: { "cache-control": "public, max-age=60, s-maxage=60, stale-while-revalidate=600" } },
    );
  } catch (e) {
    console.error("participant count failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
