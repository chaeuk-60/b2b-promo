const express = require('express');
const errorMiddleware = require('./middleware/error.middleware');

function createApp(registerRoutes) {
  const app = express();
  app.use(express.json());

  if (typeof registerRoutes === 'function') {
    registerRoutes(app);
  }

  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    next(err);
  });

  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;
