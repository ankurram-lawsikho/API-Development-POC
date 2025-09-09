const AppDataSource = require('../config/database');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken, sanitizeUser } = require('../utils/helpers');
// GraphQL errors
const AuthenticationError = (message) => new Error(`Authentication Error: ${message}`);
const ForbiddenError = (message) => new Error(`Forbidden Error: ${message}`);
const UserInputError = (message) => new Error(`User Input Error: ${message}`);

const userResolvers = {
  Query: {
    user: async (_, { id }) => {
      const userRepository = AppDataSource.getRepository(User);
      const foundUser = await userRepository.findOne({
        where: { id },
        relations: ['posts', 'comments'],
      });

      if (!foundUser) {
        throw UserInputError('User not found');
      }

      return sanitizeUser(foundUser);
    },

    users: async (_, { first = 10, after, filters = {} }) => {

      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.posts', 'posts')
        .leftJoinAndSelect('user.comments', 'comments')
        .orderBy('user.createdAt', 'DESC');

      // Apply filters
      if (filters.search) {
        queryBuilder.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters.role) {
        queryBuilder.andWhere('user.role = :role', { role: filters.role });
      }

      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
      }

      // Apply pagination
      if (after) {
        queryBuilder.andWhere('user.createdAt < :after', { after });
      }

      const users = await queryBuilder.limit(first).getMany();

      return {
        edges: users.map(user => ({
          node: sanitizeUser(user),
          cursor: user.createdAt.toISOString(),
        })),
        pageInfo: {
          hasNextPage: users.length === first,
          hasPreviousPage: !!after,
          startCursor: users[0]?.createdAt.toISOString(),
          endCursor: users[users.length - 1]?.createdAt.toISOString(),
        },
        totalCount: await queryBuilder.getCount(),
      };
    },

    me: async (_, __) => {
      // For demo purposes, return a mock user
      return {
        id: 'demo-user-1',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        fullName: 'Demo User',
        role: 'user',
        isActive: true,
        bio: 'This is a demo user for testing',
        avatar: null,
        postCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
  },

  Mutation: {
    register: async (_, { input }) => {
      const { email, password, firstName, lastName } = input;
      const userRepository = AppDataSource.getRepository(User);

      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new UserInputError('User with this email already exists');
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

      return {
        token,
        user: sanitizeUser(savedUser),
      };
    },

    login: async (_, { input }) => {
      const { email, password } = input;
      const userRepository = AppDataSource.getRepository(User);

      // Find user
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user.id);

      return {
        token,
        user: sanitizeUser(user),
      };
    },

    updateProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRepository = AppDataSource.getRepository(User);

      // Check if email is being changed and if it's already taken
      if (input.email && input.email !== user.email) {
        const existingUser = await userRepository.findOne({ where: { email: input.email } });
        if (existingUser) {
          throw new UserInputError('Email already in use');
        }
      }

      // Update user
      await userRepository.update(user.id, input);

      // Fetch updated user
      const updatedUser = await userRepository.findOne({ where: { id: user.id } });
      return sanitizeUser(updatedUser);
    },

    changePassword: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const { currentPassword, newPassword } = input;
      const userRepository = AppDataSource.getRepository(User);

      // Get current user with password
      const currentUser = await userRepository.findOne({ where: { id: user.id } });

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        throw new UserInputError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await userRepository.update(user.id, { password: hashedNewPassword });

      return { success: true };
    },

    deactivateAccount: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRepository = AppDataSource.getRepository(User);
      await userRepository.update(user.id, { isActive: false });

      return { success: true };
    },
  },

  User: {
    fullName: (user) => `${user.firstName} ${user.lastName}`,
    postCount: (user) => user.posts ? user.posts.length : 0,
    commentCount: (user) => user.comments ? user.comments.length : 0,
  },
};

module.exports = userResolvers;
