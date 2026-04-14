// health check — 3ashan el monitoring / load balancer
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// byraga3 status osayar 3an el app
router.get('/', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbState,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
