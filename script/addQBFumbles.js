const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addQBFumbles() {
  console.log("Adding fumbleLost scoring rule for QB...");

  try {
    // Check if the rule already exists
    const existingRule = await prisma.scoringRule.findUnique({
      where: {
        position_category: {
          position: "QB",
          category: "fumbleLost",
        },
      },
    });

    if (existingRule) {
      console.log("QB fumbleLost rule already exists. Skipping.");
      return;
    }

    // Add the new scoring rule
    await prisma.scoringRule.create({
      data: {
        position: "QB",
        category: "fumbleLost",
        value: -2,
        description: "Points per fumble lost",
      },
    });

    console.log("Successfully added QB fumbleLost scoring rule");
  } catch (error) {
    console.error("Error adding QB fumbleLost rule:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addQBFumbles().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
