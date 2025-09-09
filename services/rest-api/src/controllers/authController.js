const AppDataSource = require('../config/database');
const { hashPassword, comparePassword, generateToken, sanitizeUser } = require('../utils/helpers');
const { sendResponse, sendErrorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  const userRepository = AppDataSource.getRepository('User');
  
  // Check if user already exists
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    return sendErrorResponse(res, 'User with this email already exists', 409, 'USER_EXISTS');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const user = userRepository.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
  });
  
  const savedUser = await userRepository.save(user);
  
  // Generate token
  const token = generateToken(savedUser.id);
  
  // Sanitize user data
  const sanitizedUser = sanitizeUser(savedUser);
  
  sendResponse(res, {
    user: sanitizedUser,
    token,
  }, 'User registered successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const userRepository = AppDataSource.getRepository('User');
  
  // Find user
  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    return sendErrorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  
  // Check if user is active
  if (!user.isActive) {
    return sendErrorResponse(res, 'Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return sendErrorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  
  // Generate token
  const token = generateToken(user.id);
  
  // Sanitize user data
  const sanitizedUser = sanitizeUser(user);
  
  sendResponse(res, {
    user: sanitizedUser,
    token,
  }, 'Login successful');
});

const getProfile = asyncHandler(async (req, res) => {
  const userRepository = AppDataSource.getRepository('User');
  
  const user = await userRepository.findOne({
    where: { id: req.user.id },
    relations: ['posts', 'comments'],
  });
  
  if (!user) {
    return sendErrorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
  }
  
  const sanitizedUser = sanitizeUser(user);
  
  sendResponse(res, sanitizedUser, 'Profile retrieved successfully');
});

const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const userRepository = AppDataSource.getRepository('User');
  
  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return sendErrorResponse(res, 'Email already in use', 409, 'EMAIL_IN_USE');
    }
  }
  
  // Update user
  await userRepository.update(req.user.id, {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(email && { email }),
  });
  
  // Fetch updated user
  const updatedUser = await userRepository.findOne({ where: { id: req.user.id } });
  const sanitizedUser = sanitizeUser(updatedUser);
  
  sendResponse(res, sanitizedUser, 'Profile updated successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userRepository = AppDataSource.getRepository('User');
  
  // Get current user with password
  const user = await userRepository.findOne({ where: { id: req.user.id } });
  
  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return sendErrorResponse(res, 'Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }
  
  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);
  
  // Update password
  await userRepository.update(req.user.id, { password: hashedNewPassword });
  
  sendResponse(res, null, 'Password changed successfully');
});

const deactivateAccount = asyncHandler(async (req, res) => {
  const userRepository = AppDataSource.getRepository('User');
  
  await userRepository.update(req.user.id, { isActive: false });
  
  sendResponse(res, null, 'Account deactivated successfully');
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
};
