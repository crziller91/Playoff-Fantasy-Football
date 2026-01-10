// Script to update Mack Hollins' team to New England Patriots
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

console.log("Database URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + "..." : "NOT SET");

async function main() {
  console.log("Updating Mack Hollins' team...");

  try {
    const updatedPlayer = await prisma.player.update({
      where: { id: 218 },
      data: { teamName: "New England Patriots" },
    });

    console.log(`✓ Updated player: ${updatedPlayer.name} (${updatedPlayer.position}) - ${updatedPlayer.teamName}`);
    console.log("\nSuccess! Player has been updated in the database.");
  } catch (error) {
    console.error("Error updating player:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
