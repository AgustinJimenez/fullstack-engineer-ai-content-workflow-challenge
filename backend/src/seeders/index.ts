import { sequelize } from '../config/database';
import { seedCampaigns, clearDatabase } from './campaignSeeder';

async function runSeeder() {
  try {
    console.log('🌱 Database Seeder\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');
    const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '3000', 10);
    const verbose = !args.includes('--quiet');

    if (shouldClear) {
      await clearDatabase();
      console.log('');
    }

    const startTime = Date.now();
    await seedCampaigns({ count, verbose });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (verbose) {
      console.log(`\n⏱️  Total time: ${duration}s`);
      console.log('🎉 All done!\n');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runSeeder();