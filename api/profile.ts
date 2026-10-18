import { parseProfile, profileStats, profileSummary, saveProfile } from "../server/profiles.js";
import { clientIp, hashDevice, hashIp, InputError, parseId, today } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

const MAX_PER_IP_PER_DAY = 10;

// Save this device's profile and jobs (once per device) and return what people like them do.
export async function POST(request: Request): Promise<Response> {
  let input;
  try {
    input = parseProfile(await request.json());
  } catch (e) {
    return Response.json({ error: "invalid", field: e instanceof InputError ? e.message : "body" }, { status: 400 });
  }
  const deviceHash = hashDevice(request.headers.get("x-device-id"));
  if (!deviceHash) return Response.json({ error: "invalid", field: "device" }, { status: 400 });

  const db = supabaseFromEnv();
  const day = today();
  const ipHash = hashIp(clientIp(request), day);
  try {
    const { count, error: countError } = await db
      .from("fit_profiles")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("submitted_on", day);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PER_IP_PER_DAY) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { id, created } = await saveProfile(db, input, deviceHash, ipHash, day);
    if (!created) return Response.json({ error: "already_submitted", id }, { status: 409 });
    return Response.json({ id, stats: await profileStats(db, id) });
  } catch (e) {
    console.error("profile save failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}

// A saved profile's crowd data, plus its code and scores for shared links.
export async function GET(request: Request): Promise<Response> {
  let id;
  try {
    id = parseId(new URL(request.url).searchParams.get("id"));
  } catch {
    return Response.json({ error: "invalid", field: "id" }, { status: 400 });
  }
  try {
    const db = supabaseFromEnv();
    const [stats, profile] = await Promise.all([profileStats(db, id), profileSummary(db, id)]);
    if (!stats || !profile) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ id, profile, stats }, { headers: { "cache-control": "private, max-age=30" } });
  } catch (e) {
    console.error("profile stats failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
