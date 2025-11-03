const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedScoringRules() {
  console.log("Starting scoring rules seeding...");

  try {
    // Check if rules already exist
    const existingRules = await prisma.scoringRule.findMany();

    if (existingRules.length > 0) {
      console.log(
        `${existingRules.length} scoring rules already exist. Skipping seeding.`,
      );
      return;
    }

    // Define all scoring rules
    const scoringRules = [
      // QB Scoring Rules
      {
        position: "QB",
        category: "passingTouchdown",
        value: 4,
        description: "Points per passing touchdown",
      },
      {
        position: "QB",
        category: "passingYardDivisor",
        value: 25,
        description: "Passing yards divisor (1 point per X yards)",
      },
      {
        position: "QB",
        category: "interception",
        value: -2,
        description: "Points per interception",
      },
      {
        position: "QB",
        category: "completionDivisor",
        value: 10,
        description: "Completions divisor (1 point per X completions)",
      },
      {
        position: "QB",
        category: "rushingTouchdown",
        value: 6,
        description: "Points per rushing touchdown",
      },
      {
        position: "QB",
        category: "rushingYardDivisor",
        value: 10,
        description: "Rushing yards divisor (1 point per X yards)",
      },
      {
        position: "QB",
        category: "rushingAttemptDivisor",
        value: 5,
        description: "Rushing attempts divisor (1 point per X attempts)",
      },

      // RB Scoring Rules
      {
        position: "RB",
        category: "rushingTouchdown",
        value: 6,
        description: "Points per rushing touchdown",
      },
      {
        position: "RB",
        category: "rushingYardDivisor",
        value: 10,
        description: "Rushing yards divisor (1 point per X yards)",
      },
      {
        position: "RB",
        category: "rushingAttemptDivisor",
        value: 5,
        description: "Rushing attempts divisor (1 point per X attempts)",
      },
      {
        position: "RB",
        category: "receivingTouchdown",
        value: 6,
        description: "Points per receiving touchdown",
      },
      {
        position: "RB",
        category: "receivingYardDivisor",
        value: 10,
        description: "Receiving yards divisor (1 point per X yards)",
      },
      {
        position: "RB",
        category: "reception",
        value: 1,
        description: "Points per reception",
      },
      {
        position: "RB",
        category: "fumbleLost",
        value: -2,
        description: "Points per fumble lost",
      },

      // WR Scoring Rules
      {
        position: "WR",
        category: "receivingTouchdown",
        value: 6,
        description: "Points per receiving touchdown",
      },
      {
        position: "WR",
        category: "receivingYardDivisor",
        value: 10,
        description: "Receiving yards divisor (1 point per X yards)",
      },
      {
        position: "WR",
        category: "reception",
        value: 1,
        description: "Points per reception",
      },
      {
        position: "WR",
        category: "rushingTouchdown",
        value: 6,
        description: "Points per rushing touchdown",
      },
      {
        position: "WR",
        category: "rushingYardDivisor",
        value: 10,
        description: "Rushing yards divisor (1 point per X yards)",
      },
      {
        position: "WR",
        category: "rushingAttemptDivisor",
        value: 5,
        description: "Rushing attempts divisor (1 point per X attempts)",
      },
      {
        position: "WR",
        category: "fumbleLost",
        value: -2,
        description: "Points per fumble lost",
      },

      // TE Scoring Rules (same as WR)
      {
        position: "TE",
        category: "receivingTouchdown",
        value: 6,
        description: "Points per receiving touchdown",
      },
      {
        position: "TE",
        category: "receivingYardDivisor",
        value: 10,
        description: "Receiving yards divisor (1 point per X yards)",
      },
      {
        position: "TE",
        category: "reception",
        value: 1,
        description: "Points per reception",
      },
      {
        position: "TE",
        category: "rushingTouchdown",
        value: 6,
        description: "Points per rushing touchdown",
      },
      {
        position: "TE",
        category: "rushingYardDivisor",
        value: 10,
        description: "Rushing yards divisor (1 point per X yards)",
      },
      {
        position: "TE",
        category: "rushingAttemptDivisor",
        value: 5,
        description: "Rushing attempts divisor (1 point per X attempts)",
      },
      {
        position: "TE",
        category: "fumbleLost",
        value: -2,
        description: "Points per fumble lost",
      },

      // K Scoring Rules
      {
        position: "K",
        category: "pat",
        value: 1,
        description: "Points per PAT (Point After Touchdown)",
      },
      {
        position: "K",
        category: "fgMiss",
        value: -1,
        description: "Points per field goal miss",
      },
      {
        position: "K",
        category: "fg0to39",
        value: 3,
        description: "Points per field goal from 0-39 yards",
      },
      {
        position: "K",
        category: "fg40to49",
        value: 4,
        description: "Points per field goal from 40-49 yards",
      },
      {
        position: "K",
        category: "fg50to59",
        value: 5,
        description: "Points per field goal from 50-59 yards",
      },
      {
        position: "K",
        category: "fg60plus",
        value: 6,
        description: "Points per field goal from 60+ yards",
      },
    ];

    // Create all scoring rules in the database
    await prisma.scoringRule.createMany({
      data: scoringRules,
    });

    console.log(`Successfully seeded ${scoringRules.length} scoring rules`);
  } catch (error) {
    console.error("Error during scoring rules seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedScoringRules().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
