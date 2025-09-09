const AppDataSource = require('../config/database');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { sanitizeUser } = require('../utils/helpers');
// GraphQL errors
const AuthenticationError = (message) => new Error(`Authentication Error: ${message}`);
const ForbiddenError = (message) => new Error(`Forbidden Error: ${message}`);
const UserInputError = (message) => new Error(`User Input Error: ${message}`);

const commentResolvers = {
  Query: {
    comment: async (_, { id }, { user }) => {
      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({
        where: { id },
        relations: ['author', 'post', 'parent', 'replies', 'replies.author'],
      });

      if (!comment) {
        throw new UserInputError('Comment not found');
      }

      // Check if comment is approved unless user is admin/moderator
      if (!comment.isApproved && 
          (!user || (user.role !== 'admin' && user.role !== 'moderator'))) {
        throw new UserInputError('Comment not found');
      }

      // Sanitize author data
      if (comment.author) {
        comment.author = sanitizeUser(comment.author);
      }

      // Sanitize reply authors
      if (comment.replies) {
        comment.replies.forEach(reply => {
          if (reply.author) {
            reply.author = sanitizeUser(reply.author);
          }
        });
      }

      return comment;
    },

    comments: async (_, { first = 10, after, filters = {}, orderBy = { field: 'CREATED_AT', direction: 'ASC' } }, { user }) => {
      const commentRepository = AppDataSource.getRepository(Comment);
      const queryBuilder = commentRepository.createQueryBuilder('comment')
        .leftJoinAndSelect('comment.author', 'author')
        .leftJoinAndSelect('comment.replies', 'replies')
        .leftJoinAndSelect('replies.author', 'replyAuthor');

      // Apply filters
      if (filters.postId) {
        queryBuilder.andWhere('comment.postId = :postId', { postId: filters.postId });
      }

      if (filters.authorId) {
        queryBuilder.andWhere('comment.authorId = :authorId', { authorId: filters.authorId });
      }

      if (filters.parentId !== undefined) {
        if (filters.parentId === null) {
          queryBuilder.andWhere('comment.parentId IS NULL');
        } else {
          queryBuilder.andWhere('comment.parentId = :parentId', { parentId: filters.parentId });
        }
      }

      // Filter approved comments unless user is admin/moderator
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        queryBuilder.andWhere('comment.isApproved = :isApproved', { isApproved: true });
      } else if (filters.isApproved !== undefined) {
        queryBuilder.andWhere('comment.isApproved = :isApproved', { isApproved: filters.isApproved });
      }

      // Apply ordering
      const orderField = orderBy.field.toLowerCase();
      const orderDirection = orderBy.direction;
      queryBuilder.orderBy(`comment.${orderField}`, orderDirection);

      // Apply pagination
      if (after) {
        const afterDate = new Date(after);
        queryBuilder.andWhere(`comment.${orderField} < :after`, { after: afterDate });
      }

      const comments = await queryBuilder.limit(first).getMany();

      // Sanitize author data
      comments.forEach(comment => {
        if (comment.author) {
          comment.author = sanitizeUser(comment.author);
        }
        if (comment.replies) {
          comment.replies.forEach(reply => {
            if (reply.author) {
              reply.author = sanitizeUser(reply.author);
            }
          });
        }
      });

      return {
        edges: comments.map(comment => ({
          node: comment,
          cursor: comment[orderField].toISOString(),
        })),
        pageInfo: {
          hasNextPage: comments.length === first,
          hasPreviousPage: !!after,
          startCursor: comments[0]?.[orderField].toISOString(),
          endCursor: comments[comments.length - 1]?.[orderField].toISOString(),
        },
        totalCount: await queryBuilder.getCount(),
      };
    },
  },

  Mutation: {
    createComment: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const { content, postId, parentId } = input;
      const commentRepository = AppDataSource.getRepository(Comment);
      const postRepository = AppDataSource.getRepository(Post);

      // Check if post exists
      const post = await postRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw new UserInputError('Post not found');
      }

      // Check if parent comment exists (for replies)
      if (parentId) {
        const parentComment = await commentRepository.findOne({ where: { id: parentId } });
        if (!parentComment) {
          throw new UserInputError('Parent comment not found');
        }
      }

      // Create comment
      const comment = commentRepository.create({
        content,
        authorId: user.id,
        postId,
        parentId: parentId || null,
        isApproved: user.role === 'admin' || user.role === 'moderator', // Auto-approve for admins/moderators
      });

      const savedComment = await commentRepository.save(comment);

      // Fetch complete comment with relations
      const completeComment = await commentRepository.findOne({
        where: { id: savedComment.id },
        relations: ['author', 'post', 'parent', 'replies'],
      });

      // Sanitize author data
      if (completeComment.author) {
        completeComment.author = sanitizeUser(completeComment.author);
      }

      return completeComment;
    },

    updateComment: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw new UserInputError('Comment not found');
      }

      // Check if user is the author or admin/moderator
      if (user.id !== comment.authorId && 
          user.role !== 'admin' && 
          user.role !== 'moderator') {
        throw new ForbiddenError('Not authorized to update this comment');
      }

      comment.content = input.content;
      const updatedComment = await commentRepository.save(comment);

      // Fetch complete comment with relations
      const completeComment = await commentRepository.findOne({
        where: { id: updatedComment.id },
        relations: ['author', 'post', 'parent', 'replies'],
      });

      // Sanitize author data
      if (completeComment.author) {
        completeComment.author = sanitizeUser(completeComment.author);
      }

      return completeComment;
    },

    deleteComment: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw new UserInputError('Comment not found');
      }

      // Check if user is the author or admin/moderator
      if (user.id !== comment.authorId && 
          user.role !== 'admin' && 
          user.role !== 'moderator') {
        throw new ForbiddenError('Not authorized to delete this comment');
      }

      await commentRepository.remove(comment);
      return { success: true };
    },

    approveComment: async (_, { id }, { user }) => {
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        throw new ForbiddenError('Admin or moderator access required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw new UserInputError('Comment not found');
      }

      comment.isApproved = true;
      const updatedComment = await commentRepository.save(comment);

      return updatedComment;
    },

    rejectComment: async (_, { id }, { user }) => {
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        throw new ForbiddenError('Admin or moderator access required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw new UserInputError('Comment not found');
      }

      comment.isApproved = false;
      const updatedComment = await commentRepository.save(comment);

      return updatedComment;
    },
  },

  Comment: {
    replyCount: (comment) => comment.replies ? comment.replies.length : 0,
  },
};

module.exports = commentResolvers;
