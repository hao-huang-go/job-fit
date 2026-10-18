// Writes the same-type job stats the offline rednote mini-tool ships with. Run before `build:xhs`.
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const { data, error } = await db.rpc("fit_snapshot");
if (error) throw error;
const generatedOn = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
writeFileSync(new URL("../src/xhs/snapshot.json", import.meta.url), JSON.stringify({ ...data, generatedOn }) + "\n");
console.log(`snapshot: ${data.total} profiles, ${generatedOn}`);
