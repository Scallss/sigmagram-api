import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function undoSeed() {
  try {
    // Delete posts
    await prisma.post.deleteMany({});
    console.log('Deleted all posts.');

    // Delete community followers
    await prisma.communityFollower.deleteMany({});
    console.log('Deleted all community followers.');

    // Delete communities
    await prisma.community.deleteMany({});
    console.log('Deleted all communities.');

    // Delete users
    await prisma.user.deleteMany({});
    console.log('Deleted all users.');

    console.log('Seeding undone successfully!');
  } catch (error) {
    console.error('Error undoing seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

undoSeed();