// DATABASE_URL is already loaded by dotenv-cli from .env.test before this script runs.
// Reading .env directly would pick up the dev DB — intentionally avoided.
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || !dbUrl.includes('_test')) {
  console.error('\n❌ ERROR: DATABASE_URL for tests MUST contain the "_test" suffix to prevent accidental drops of dev/prod data.');
  console.error('Current DATABASE_URL:', dbUrl || 'Not found');
  console.error('Please configure your .env.test file or environment variables properly.\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL test check passed:', dbUrl);
