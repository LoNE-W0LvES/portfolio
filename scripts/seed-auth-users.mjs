import { createClient } from "@supabase/supabase-js";

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function hasArg(name) {
  return process.argv.includes(name);
}

async function listAllAuthUsers(supabase) {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const current = data?.users ?? [];
    users.push(...current);

    if (current.length < perPage) break;
    page += 1;
  }

  return users;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = getArg("--password") || process.env.AUTH_DEFAULT_PASSWORD;
const resetExisting = hasArg("--reset-password");

if (!supabaseUrl) {
  console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL).");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!password) {
  console.error("Missing password. Pass --password \"...\" or set AUTH_DEFAULT_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: emailRows, error: emailError } = await supabase
  .from("site_user_emails")
  .select("email")
  .order("created_at", { ascending: true });

if (emailError) {
  console.error(`Failed to read site_user_emails: ${emailError.message}`);
  process.exit(1);
}

const emails = [...new Set((emailRows ?? []).map((row) => (row.email || "").trim().toLowerCase()).filter(Boolean))];

if (emails.length === 0) {
  console.error("No emails found in site_user_emails. Run supabase/schema.sql first.");
  process.exit(1);
}

const authUsers = await listAllAuthUsers(supabase);
const byEmail = new Map(
  authUsers
    .map((u) => [String(u.email || "").toLowerCase(), u])
    .filter(([email]) => email)
);

let created = 0;
let updated = 0;
let skipped = 0;

for (const email of emails) {
  const existing = byEmail.get(email);

  if (existing) {
    if (resetExisting) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`Failed to update ${email}: ${error.message}`);
        process.exit(1);
      }
      updated += 1;
      console.log(`Updated password: ${email}`);
    } else {
      skipped += 1;
      console.log(`Already exists: ${email}`);
    }
    continue;
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error(`Failed to create ${email}: ${error.message}`);
    process.exit(1);
  }

  created += 1;
  console.log(`Created auth user: ${email}`);
}

console.log(`Done. created=${created}, updated=${updated}, skipped=${skipped}`);
