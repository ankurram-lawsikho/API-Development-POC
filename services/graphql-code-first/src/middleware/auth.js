const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRepository = AppDataSource.getRepository('User');
    const user = await userRepository.findOne({
      where: { id: decoded.userId, isActive: true }
    });

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Token is invalid, but we don't throw an error here
    // Let GraphQL resolvers handle authentication
  }

  next();
};

const getContext = async ({ req }) => {
  // Get token from request
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { user: null };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRepository = AppDataSource.getRepository('User');
    const user = await userRepository.findOne({
      where: { id: decoded.userId, isActive: true }
    });

    return { user };
  } catch (error) {
    return { user: null };
  }
};

module.exports = {
  authenticateToken,
  getContext,
};
