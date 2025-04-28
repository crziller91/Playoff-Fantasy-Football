import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPermissions() {
    console.log("Starting permissions seeding...");

    try {
        // Get all existing users
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users`);

        if (users.length === 0) {
            console.log("No users found to seed permissions for.");
            return;
        }

        // Create permissions for each user
        // For now, we'll grant editScores permission only to the first user (assuming it's the admin)
        // You can modify this logic to grant permissions to specific users based on email or other criteria
        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            // Check if permissions already exist for this user
            const existingPermission = await prisma.permission.findUnique({
                where: { userId: user.id }
            });

            if (existingPermission) {
                console.log(`Permissions already exist for user ${user.name || user.email || user.id}`);
                continue;
            }

            // Create permission record
            // Grant editScores permission to the first user only
            const isAdmin = i === 0;

            await prisma.permission.create({
                data: {
                    userId: user.id,
                    editScores: isAdmin, // First user gets admin rights
                }
            });

            console.log(`Created permissions for user ${user.name || user.email || user.id} (Admin: ${isAdmin})`);
        }

        console.log("Permissions seeding completed successfully.");
    } catch (error) {
        console.error("Error during permissions seeding:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedPermissions()
    .catch(e => {
        console.error("Seeding failed:", e);
        process.exit(1);
    });