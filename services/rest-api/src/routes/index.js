const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const postRoutes = require('./posts');
const commentRoutes = require('./comments');
const tagRoutes = require('./tags');

// API versioning
const v1Routes = express.Router();

// Mount routes
v1Routes.use('/auth', authRoutes);
v1Routes.use('/posts', postRoutes);
v1Routes.use('/comments', commentRoutes);
v1Routes.use('/tags', tagRoutes);

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 service:
 *                   type: string
 *                   example: "REST API"
 */
// Health check endpoint
v1Routes.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'REST API'
  });
});

// Mount versioned routes
router.use('/v1', v1Routes);

// Default route (latest version)
router.use('/', v1Routes);

module.exports = router;
