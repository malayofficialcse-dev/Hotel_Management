const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");

// Match the URL used by the local Nest process, even when its parent shell has
// an old DATABASE_URL. Production startup does not run this development hook.
dotenv.config({ override: process.env.NODE_ENV !== "production" });

const prismaCli = require.resolve("prisma/build/index.js");
const result = spawnSync(
  process.execPath,
  [prismaCli, "db", "push"],
  { stdio: "inherit", env: process.env },
);

if (result.error) {
  console.error("Could not run Prisma schema sync:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
