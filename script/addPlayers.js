// Script to add missing players to the PRODUCTION database
//
// IMPORTANT: This script uses the DATABASE_URL from your environment
//
// To run against PRODUCTION:
// 1. Set the DATABASE_URL environment variable to your production database
// 2. Run: DATABASE_URL="your-production-db-url" node script/addPlayers.js
//
// Or create a .env.production file with your production DATABASE_URL and run:
// node -r dotenv/config script/addPlayers.js dotenv_config_path=.env.production
//
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Verify which database we're connecting to
console.log("Database URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + "..." : "NOT SET");

// Players to add
const newPlayers = [
  { id: 218, name: "Mack Hollins", position: "WR", teamName: "New England Patriots" },
  { id: 219, name: "Jauan Jennings", position: "WR", teamName: "San Francisco 49ers" },
];

async function main() {
  console.log("Adding missing players to the database...");

  try {
    for (const player of newPlayers) {
      // Check if player already exists
      const existingPlayer = await prisma.player.findUnique({
        where: { id: player.id },
      });

      if (existingPlayer) {
        console.log(`Player with ID ${player.id} already exists: ${existingPlayer.name}`);
        continue;
      }

      // Create the player
      const createdPlayer = await prisma.player.create({
        data: player,
      });

      console.log(`✓ Added player: ${createdPlayer.name} (${createdPlayer.position}) - ${createdPlayer.teamName}`);
    }

    console.log("\nSuccess! All players have been added to the database.");
  } catch (error) {
    console.error("Error adding players:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
