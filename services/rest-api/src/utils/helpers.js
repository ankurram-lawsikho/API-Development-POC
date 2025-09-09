const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password utilities
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// String utilities
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Pagination utilities
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

const buildPaginationInfo = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };
};

// Query building utilities
const buildWhereClause = (filters) => {
  const where = {};
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      where[key] = filters[key];
    }
  });
  
  return where;
};

const buildSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm || !searchFields.length) return {};
  
  return searchFields.map(field => ({
    [field]: { $ilike: `%${searchTerm}%` }
  }));
};

// Date utilities
const formatDate = (date) => {
  return new Date(date).toISOString();
};

const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

// Object utilities
const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

module.exports = {
  // Password utilities
  hashPassword,
  comparePassword,
  
  // JWT utilities
  generateToken,
  verifyToken,
  
  // String utilities
  generateSlug,
  generateRandomString,
  
  // Pagination utilities
  getPaginationParams,
  buildPaginationInfo,
  
  // Query utilities
  buildWhereClause,
  buildSearchQuery,
  
  // Date utilities
  formatDate,
  isValidDate,
  
  // Object utilities
  sanitizeUser,
  pick,
  omit,
};
