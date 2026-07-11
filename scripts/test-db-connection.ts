import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const playerCount = await prisma.player.count();
    console.log(`📊 Players in database: ${playerCount}`);
    
    const matchCount = await prisma.match.count();
    console.log(`🎾 Matches in database: ${matchCount}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();