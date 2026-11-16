import { seedPilotDemoData } from '../../../scripts/seed_pilot_demo_data';

export async function runSeedDemo() {
  await seedPilotDemoData();
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed-demo')) {
  runSeedDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Demo seeding failed:', err);
      process.exit(1);
    });
}
