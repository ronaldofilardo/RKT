require('dotenv').config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

const jest = require('jest');
const args = process.argv.slice(2);
jest.run(args);