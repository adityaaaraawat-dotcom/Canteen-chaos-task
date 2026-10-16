// server.js - wiring only. Routes live in routes/, thinking lives in logic/.

const express = require('express');
const cors = require('cors');
const path = require('path');

const store = require('./store');
const availability = require('./logic/availability');
const scheduling = require('./logic/scheduling');
const statusLogic = require('./logic/status');

const { requestId, fakeLatency } = require('./middleware/requestId');
const { rateLimit } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler, asyncHandler } = require('./middleware/errors');

const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/orders.routes');
const couponRoutes = require('./routes/coupons.routes');
const staffRoutes = require('./routes/staff.routes');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const LATENCY_MS = Number(process.env.LATENCY_MS === undefined ? 250 : process.env.LATENCY_MS);
const AUTO_COOK = process.env.AUTO_COOK !== 'false';
const KITCHEN_TICK_MS = Number(process.env.KITCHEN_TICK_MS || 10000);

app.set('trust proxy', true);
app.use(cors({ exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'Retry-After'] }));
app.use(express.json({ limit: '64kb' }));
app.use(requestId);

app.use('/api', fakeLatency(LATENCY_MS));
app.use('/api', rateLimit({ windowMs: 60000, max: 600, name: 'global' }));

// static frontend, served by the same server so there is nothing else to run
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/* ------------------------------------------------------------ routes */

app.use('/api/menu', menuRoutes.router);
app.use('/api/orders', orderRoutes.router);
app.use('/api', couponRoutes.router);
app.use('/api', staffRoutes.router);

app.post('/api/cart/quote', orderRoutes.quote);

app.get(
  '/api/health',
  asyncHandler((req, res) => {
    const now = new Date();
    res.json({
      status: 'ok',
      build: 'v3-clean',
      open: availability.isCanteenOpen(now),
      slot: availability.currentSlot(now),
      rushHour: scheduling.isRushHour(now),
      autoCook: AUTO_COOK,
      queue: statusLogic.queueLength(store.read('orders')),
      serverTime: now.toISOString(),
      requestId: req.id,
    });
  })
);

app.use('/api', notFoundHandler);
app.use(errorHandler);

/* ----------------------------------------------------------- kitchen */

// Moves orders along on their own, so the tracking screen has something
// to show without a person clicking buttons on the staff page.
function kitchenTick() {
  const orders = store.read('orders');
  if (orders.length === 0) return;

  const { orders: next, moved } = statusLogic.autoAdvance(orders, new Date());
  if (moved > 0) store.write('orders', next);
}

let kitchen = null;

function startKitchen() {
  if (!AUTO_COOK || kitchen) return;
  kitchen = setInterval(kitchenTick, KITCHEN_TICK_MS);
  if (kitchen.unref) kitchen.unref();
}

function stopKitchen() {
  if (kitchen) clearInterval(kitchen);
  kitchen = null;
}

if (require.main === module) {
  startKitchen();
  app.listen(PORT, () => {
    console.log(`Canteen Chaos on http://localhost:${PORT}`);
    console.log(`  latency ${LATENCY_MS}ms  auto-cook ${AUTO_COOK}  tick ${KITCHEN_TICK_MS}ms`);
  });
}

module.exports = { app, startKitchen, stopKitchen, kitchenTick };
