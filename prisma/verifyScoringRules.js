const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyScoringRules() {
  console.log("Verifying new scoring rules...\n");

  try {
    // Check QB 2PT conversion
    const qbTwoPt = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "QB", category: "twoPtConversion" } }
    });
    console.log("QB twoPtConversion:", qbTwoPt ? `✓ ${qbTwoPt.value} points` : "✗ NOT FOUND");

    // Check RB passing touchdown
    const rbPassTD = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "RB", category: "passingTouchdown" } }
    });
    console.log("RB passingTouchdown:", rbPassTD ? `✓ ${rbPassTD.value} points` : "✗ NOT FOUND");

    // Check RB 2PT conversion
    const rbTwoPt = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "RB", category: "twoPtConversion" } }
    });
    console.log("RB twoPtConversion:", rbTwoPt ? `✓ ${rbTwoPt.value} points` : "✗ NOT FOUND");

    // Check WR passing touchdown
    const wrPassTD = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "WR", category: "passingTouchdown" } }
    });
    console.log("WR passingTouchdown:", wrPassTD ? `✓ ${wrPassTD.value} points` : "✗ NOT FOUND");

    // Check WR 2PT conversion
    const wrTwoPt = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "WR", category: "twoPtConversion" } }
    });
    console.log("WR twoPtConversion:", wrTwoPt ? `✓ ${wrTwoPt.value} points` : "✗ NOT FOUND");

    // Check TE passing touchdown
    const tePassTD = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "TE", category: "passingTouchdown" } }
    });
    console.log("TE passingTouchdown:", tePassTD ? `✓ ${tePassTD.value} points` : "✗ NOT FOUND");

    // Check TE 2PT conversion
    const teTwoPt = await prisma.scoringRule.findUnique({
      where: { position_category: { position: "TE", category: "twoPtConversion" } }
    });
    console.log("TE twoPtConversion:", teTwoPt ? `✓ ${teTwoPt.value} points` : "✗ NOT FOUND");

    console.log("\n✓ All new scoring rules verified successfully!");
  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyScoringRules().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
