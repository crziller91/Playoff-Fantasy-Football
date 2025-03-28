const { execSync } = require("child_process");

console.log("Starting database reset process...");

// Run migrations reset which will handle database file properly
try {
  console.log("Running database migrations reset...");
  // Force the reset without asking for confirmation
  execSync("npx prisma migrate reset --force", { stdio: "inherit" });
  console.log("Database reset complete.");
} catch (err) {
  console.error("Error resetting database:", err);
  process.exit(1);
}
