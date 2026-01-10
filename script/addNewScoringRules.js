const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addNewScoringRules() {
  console.log("Starting to add new scoring rules...");

  try {
    const newRules = [
      // Add 2PT conversion for QB
      {
        position: "QB",
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-point conversion",
      },
      // Add passing touchdown for RB
      {
        position: "RB",
        category: "passingTouchdown",
        value: 4,
        description: "Points per passing touchdown",
      },
      // Add 2PT conversion for RB
      {
        position: "RB",
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-point conversion",
      },
      // Add passing touchdown for WR
      {
        position: "WR",
        category: "passingTouchdown",
        value: 4,
        description: "Points per passing touchdown",
      },
      // Add 2PT conversion for WR
      {
        position: "WR",
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-point conversion",
      },
      // Add passing touchdown for TE
      {
        position: "TE",
        category: "passingTouchdown",
        value: 4,
        description: "Points per passing touchdown",
      },
      // Add 2PT conversion for TE
      {
        position: "TE",
        category: "twoPtConversion",
        value: 2,
        description: "Points per 2-point conversion",
      },
    ];

    for (const rule of newRules) {
      const existing = await prisma.scoringRule.findUnique({
        where: {
          position_category: {
            position: rule.position,
            category: rule.category,
          },
        },
      });

      if (!existing) {
        await prisma.scoringRule.create({
          data: rule,
        });
        console.log(`✓ Added ${rule.position} ${rule.category} rule`);
      } else {
        console.log(`- ${rule.position} ${rule.category} rule already exists`);
      }
    }

    console.log("\nSuccessfully added new scoring rules!");
  } catch (error) {
    console.error("Error during scoring rules addition:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addNewScoringRules().catch((e) => {
  console.error("Failed to add scoring rules:", e);
  process.exit(1);
});
