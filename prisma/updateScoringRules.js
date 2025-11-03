const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateScoringRules() {
  console.log("Starting scoring rules update...");

  try {
    // Delete 2PT conversion rules for QB, RB, WR, TE
    console.log("Removing 2PT conversion rules...");
    const deleted = await prisma.scoringRule.deleteMany({
      where: {
        AND: [
          { category: "twoPtConversion" },
          { position: { in: ["QB", "RB", "WR", "TE"] } },
        ],
      },
    });
    console.log(`Deleted ${deleted.count} 2PT conversion rules`);

    // Add QB rushing rules
    console.log("Adding QB rushing rules...");

    // Check if QB rushing rules already exist
    const existingQBRushingTD = await prisma.scoringRule.findUnique({
      where: {
        position_category: {
          position: "QB",
          category: "rushingTouchdown",
        },
      },
    });

    if (!existingQBRushingTD) {
      await prisma.scoringRule.create({
        data: {
          position: "QB",
          category: "rushingTouchdown",
          value: 6,
          description: "Points per rushing touchdown",
        },
      });
      console.log("Added QB rushingTouchdown rule");
    } else {
      console.log("QB rushingTouchdown rule already exists");
    }

    const existingQBRushingYards = await prisma.scoringRule.findUnique({
      where: {
        position_category: {
          position: "QB",
          category: "rushingYardDivisor",
        },
      },
    });

    if (!existingQBRushingYards) {
      await prisma.scoringRule.create({
        data: {
          position: "QB",
          category: "rushingYardDivisor",
          value: 10,
          description: "Rushing yards divisor (1 point per X yards)",
        },
      });
      console.log("Added QB rushingYardDivisor rule");
    } else {
      console.log("QB rushingYardDivisor rule already exists");
    }

    const existingQBRushingAttempts = await prisma.scoringRule.findUnique({
      where: {
        position_category: {
          position: "QB",
          category: "rushingAttemptDivisor",
        },
      },
    });

    if (!existingQBRushingAttempts) {
      await prisma.scoringRule.create({
        data: {
          position: "QB",
          category: "rushingAttemptDivisor",
          value: 5,
          description: "Rushing attempts divisor (1 point per X attempts)",
        },
      });
      console.log("Added QB rushingAttemptDivisor rule");
    } else {
      console.log("QB rushingAttemptDivisor rule already exists");
    }

    // Add RB receiving and fumble rules
    console.log("Adding RB receiving and fumble rules...");

    const rbRules = [
      { category: "receivingTouchdown", value: 6, description: "Points per receiving touchdown" },
      { category: "receivingYardDivisor", value: 10, description: "Receiving yards divisor (1 point per X yards)" },
      { category: "reception", value: 1, description: "Points per reception" },
      { category: "fumbleLost", value: -2, description: "Points per fumble lost" }
    ];

    for (const rule of rbRules) {
      const existing = await prisma.scoringRule.findUnique({
        where: { position_category: { position: "RB", category: rule.category } }
      });

      if (!existing) {
        await prisma.scoringRule.create({
          data: { position: "RB", ...rule }
        });
        console.log(`Added RB ${rule.category} rule`);
      } else {
        console.log(`RB ${rule.category} rule already exists`);
      }
    }

    // Add WR rushing and fumble rules
    console.log("Adding WR rushing and fumble rules...");

    const wrRules = [
      { category: "rushingTouchdown", value: 6, description: "Points per rushing touchdown" },
      { category: "rushingYardDivisor", value: 10, description: "Rushing yards divisor (1 point per X yards)" },
      { category: "rushingAttemptDivisor", value: 5, description: "Rushing attempts divisor (1 point per X attempts)" },
      { category: "fumbleLost", value: -2, description: "Points per fumble lost" }
    ];

    for (const rule of wrRules) {
      const existing = await prisma.scoringRule.findUnique({
        where: { position_category: { position: "WR", category: rule.category } }
      });

      if (!existing) {
        await prisma.scoringRule.create({
          data: { position: "WR", ...rule }
        });
        console.log(`Added WR ${rule.category} rule`);
      } else {
        console.log(`WR ${rule.category} rule already exists`);
      }
    }

    // Add TE rushing and fumble rules
    console.log("Adding TE rushing and fumble rules...");

    const teRules = [
      { category: "rushingTouchdown", value: 6, description: "Points per rushing touchdown" },
      { category: "rushingYardDivisor", value: 10, description: "Rushing yards divisor (1 point per X yards)" },
      { category: "rushingAttemptDivisor", value: 5, description: "Rushing attempts divisor (1 point per X attempts)" },
      { category: "fumbleLost", value: -2, description: "Points per fumble lost" }
    ];

    for (const rule of teRules) {
      const existing = await prisma.scoringRule.findUnique({
        where: { position_category: { position: "TE", category: rule.category } }
      });

      if (!existing) {
        await prisma.scoringRule.create({
          data: { position: "TE", ...rule }
        });
        console.log(`Added TE ${rule.category} rule`);
      } else {
        console.log(`TE ${rule.category} rule already exists`);
      }
    }

    console.log("Successfully updated scoring rules");
  } catch (error) {
    console.error("Error during scoring rules update:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateScoringRules().catch((e) => {
  console.error("Update failed:", e);
  process.exit(1);
});
