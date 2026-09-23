// The HTTP smoke test replaces persistence and must not use a developer database.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/babblr_test';
process.env.DB_NAME = 'babblr_test';
process.env.NODE_ENV = 'test';
