import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .dev.vars if present
const devVarsPath = resolve(process.cwd(), ".dev.vars");
if (existsSync(devVarsPath)) {
  dotenv.config({ path: devVarsPath });
} else {
  dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL is not set.");
  console.error("Please provide it via environment variable or in server/.dev.vars:");
  console.error("  DATABASE_URL='postgresql://...' node scripts/manage-admins.mjs");
  process.exit(1);
}

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const TARGET_ADMINS = [
  {
    email: "harumemoirs@gmail.com",
    name: "Haru Memoirs",
    password: "harumemoirs2027#"
  },
  {
    email: "ankitbhavarthe123@gmail.com",
    name: "Ankit Bhavarthe",
    password: "ankit2003@A"
  }
];

async function main() {
  const sql = neon(databaseUrl);

  console.log("Connecting to database...");

  // 1. Fetch current admins
  const currentAdmins = await sql`SELECT id, email, name FROM admins;`;
  console.log(`Found ${currentAdmins.length} existing admin(s):`);
  currentAdmins.forEach(a => console.log(` - ${a.email} (${a.id})`));

  // 2. Upsert target admins
  const targetAdminIds = [];
  let primaryAdminId = null;

  for (const admin of TARGET_ADMINS) {
    const hashedPassword = await hashPassword(admin.password);
    const existing = await sql`SELECT id FROM admins WHERE email = ${admin.email} LIMIT 1;`;

    let adminId;
    if (existing.length > 0) {
      adminId = existing[0].id;
      await sql`
        UPDATE admins 
        SET password = ${hashedPassword}, name = ${admin.name}, updated_at = NOW() 
        WHERE id = ${adminId};
      `;
      console.log(`Updated admin password for: ${admin.email}`);
    } else {
      const inserted = await sql`
        INSERT INTO admins (email, name, password) 
        VALUES (${admin.email}, ${admin.name}, ${hashedPassword})
        RETURNING id;
      `;
      adminId = inserted[0].id;
      console.log(`Created new admin: ${admin.email}`);
    }

    targetAdminIds.push(adminId);
    if (!primaryAdminId) {
      primaryAdminId = adminId;
    }
  }

  // 3. Prevent cascade deletion of blogs, journals, poems, and letters:
  // Reassign any content owned by old admins to primaryAdminId
  console.log("Reassigning existing content from old admins to primary admin to prevent cascade deletion...");
  await sql`UPDATE blogs SET admin_id = ${primaryAdminId} WHERE admin_id != ALL(${targetAdminIds});`;
  await sql`UPDATE journals SET admin_id = ${primaryAdminId} WHERE admin_id != ALL(${targetAdminIds});`;
  await sql`UPDATE poems SET admin_id = ${primaryAdminId} WHERE admin_id != ALL(${targetAdminIds});`;
  await sql`UPDATE letters SET admin_id = ${primaryAdminId} WHERE admin_id != ALL(${targetAdminIds});`;

  // 4. Delete old admins
  const deleted = await sql`
    DELETE FROM admins 
    WHERE email != ALL(${TARGET_ADMINS.map(a => a.email)})
    RETURNING id, email;
  `;
  if (deleted.length > 0) {
    console.log(`Removed ${deleted.length} old admin(s):`);
    deleted.forEach(a => console.log(` - ${a.email}`));
  } else {
    console.log("No extra admins to remove.");
  }

  // 5. Final verification
  const finalAdmins = await sql`SELECT id, email, name, created_at FROM admins;`;
  console.log("\nSuccess! Current admins in database:");
  finalAdmins.forEach(a => console.log(` ✓ ${a.email} (${a.name})`));
}

main().catch(err => {
  console.error("Failed to manage admins:", err);
  process.exit(1);
});
