import('../server/seed-investments.js').then(async ({ seedInvestments }) => {
  try {
    await seedInvestments();
    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
});
