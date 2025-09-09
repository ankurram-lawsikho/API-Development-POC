const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../config/database');

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
  getContext,
};
