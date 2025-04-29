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
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-pt conversion",
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
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-pt conversion",
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
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-pt conversion",
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
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-pt conversion",
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

      // DST Scoring Rules
      {
        position: "DST",
        category: "touchdown",
        value: 6,
        description: "Points per touchdown (defensive or special teams)",
      },
      {
        position: "DST",
        category: "sack",
        value: 2,
        description: "Points per sack",
      },
      {
        position: "DST",
        category: "blockedKick",
        value: 2,
        description: "Points per blocked kick",
      },
      {
        position: "DST",
        category: "interception",
        value: 2,
        description: "Points per interception",
      },
      {
        position: "DST",
        category: "fumbleRecovery",
        value: 2,
        description: "Points per fumble recovery",
      },
      {
        position: "DST",
        category: "safety",
        value: 2,
        description: "Points per safety",
      },
      {
        position: "DST",
        category: "points0",
        value: 10,
        description: "Points for allowing 0 points",
      },
      {
        position: "DST",
        category: "points1to6",
        value: 5,
        description: "Points for allowing 1-6 points",
      },
      {
        position: "DST",
        category: "points7to13",
        value: 3,
        description: "Points for allowing 7-13 points",
      },
      {
        position: "DST",
        category: "points14to17",
        value: 1,
        description: "Points for allowing 14-17 points",
      },
      {
        position: "DST",
        category: "points18to27",
        value: 0,
        description: "Points for allowing 18-27 points",
      },
      {
        position: "DST",
        category: "points28to34",
        value: -1,
        description: "Points for allowing 28-34 points",
      },
      {
        position: "DST",
        category: "points35to45",
        value: -3,
        description: "Points for allowing 35-45 points",
      },
      {
        position: "DST",
        category: "pointsOver45",
        value: -5,
        description: "Points for allowing 46+ points",
      },
      {
        position: "DST",
        category: "yards0to99",
        value: 5,
        description: "Points for allowing 0-99 yards",
      },
      {
        position: "DST",
        category: "yards100to199",
        value: 3,
        description: "Points for allowing 100-199 yards",
      },
      {
        position: "DST",
        category: "yards200to299",
        value: 2,
        description: "Points for allowing 200-299 yards",
      },
      {
        position: "DST",
        category: "yards300to399",
        value: 0,
        description: "Points for allowing 300-399 yards",
      },
      {
        position: "DST",
        category: "yards400to449",
        value: -1,
        description: "Points for allowing 400-449 yards",
      },
      {
        position: "DST",
        category: "yards450to499",
        value: -3,
        description: "Points for allowing 450-499 yards",
      },
      {
        position: "DST",
        category: "yards500plus",
        value: -5,
        description: "Points for allowing 500+ yards",
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
