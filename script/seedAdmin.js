// Simple script to add admin permissions to a specific user
// Run with: node script/seedAdmin.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Change this to the email of the user you want to grant admin rights to
const ADMIN_EMAIL = "cziller43@gmail.com";

async function main() {
  console.log(`Setting up admin permissions for ${ADMIN_EMAIL}...`);

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!user) {
      console.error(`User with email ${ADMIN_EMAIL} not found.`);
      console.log(
        "Please sign in to the application first to create your user account.",
      );
      return;
    }

    console.log(`Found user: ${user.name || user.email}`);

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { userId: user.id },
    });

    if (existingPermission) {
      // Update existing permission
      const updatedPermission = await prisma.permission.update({
        where: { userId: user.id },
        data: { editScores: true },
      });
      console.log(
        `Updated permissions for ${user.name || user.email}. Admin rights granted.`,
      );
    } else {
      // Create new permission
      const newPermission = await prisma.permission.create({
        data: {
          userId: user.id,
          editScores: true,
        },
      });
      console.log(
        `Created new permissions for ${user.name || user.email}. Admin rights granted.`,
      );
    }

    console.log(
      "Success! You can now manage user permissions in the application.",
    );
  } catch (error) {
    console.error("Error setting up admin permissions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
