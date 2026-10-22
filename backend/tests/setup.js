// Jest setup — runs BEFORE each test file is loaded.
//
// Why this exists: src/config/db.js calls process.exit(1) when the Supabase
// env vars are missing, which would kill the whole Jest worker during a plain
// `require`. Dummy values here make the module loadable; unit tests that need
// the data layer mock it anyway with jest.mock().

// Load backend/.env FIRST: dotenv never overrides variables that are already
// set, so the dummies below then only fill genuine gaps. Integration/API
// suites thereby talk to the real Supabase project from .env; unit suites
// mock the data layer and never notice the difference.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'test-secret-key';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'daytripgo-test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
