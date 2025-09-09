const { AppDataSource } = require('../config/database');
const { getPaginationParams, buildPaginationInfo, sanitizeUser } = require('../utils/helpers');
const { sendResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  const commentRepository = AppDataSource.getRepository('Comment');
  const postRepository = AppDataSource.getRepository('Post');
  
  // Check if post exists
  const post = await postRepository.findOne({ where: { id: postId } });
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Check if parent comment exists (for replies)
  if (parentId) {
    const parentComment = await commentRepository.findOne({ where: { id: parentId } });
    if (!parentComment) {
      return sendErrorResponse(res, 'Parent comment not found', 404, 'PARENT_COMMENT_NOT_FOUND');
    }
  }
  
  // Create comment
  const comment = commentRepository.create({
    content,
    authorId: req.user.id,
    postId,
    parentId: parentId || null,
    isApproved: req.user.role === 'admin' || req.user.role === 'moderator', // Auto-approve for admins/moderators
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
  
  sendResponse(res, completeComment, 'Comment created successfully', 201);
});

const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page, limit, offset } = getPaginationParams(req.query);
  const { sort = 'createdAt', order = 'ASC' } = req.query;
  
  const commentRepository = AppDataSource.getRepository('Comment');
  const postRepository = AppDataSource.getRepository('Post');
  
  // Check if post exists
  const post = await postRepository.findOne({ where: { id: postId } });
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  const queryBuilder = commentRepository.createQueryBuilder('comment')
    .leftJoinAndSelect('comment.author', 'author')
    .leftJoinAndSelect('comment.replies', 'replies')
    .leftJoinAndSelect('replies.author', 'replyAuthor')
    .where('comment.postId = :postId', { postId })
    .andWhere('comment.parentId IS NULL') // Only top-level comments
    .orderBy(`comment.${sort}`, order);
  
  // Filter approved comments unless user is admin/moderator
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    queryBuilder.andWhere('comment.isApproved = :isApproved', { isApproved: true });
  }
  
  // Get total count
  const total = await queryBuilder.getCount();
  
  // Apply pagination
  const comments = await queryBuilder
    .skip(offset)
    .take(limit)
    .getMany();
  
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
  
  const pagination = buildPaginationInfo(page, limit, total);
  
  sendPaginatedResponse(res, comments, pagination, 'Comments retrieved successfully');
});

const getComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const commentRepository = AppDataSource.getRepository('Comment');
  
  const comment = await commentRepository.findOne({
    where: { id },
    relations: ['author', 'post', 'parent', 'replies', 'replies.author'],
  });
  
  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  
  // Check if comment is approved unless user is admin/moderator
  if (!comment.isApproved && 
      (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator'))) {
    return sendErrorResponse(res, 'Comment not found', 404, 'COMMENT_NOT_FOUND');
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
  
  sendResponse(res, comment, 'Comment retrieved successfully');
});

const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const commentRepository = AppDataSource.getRepository('Comment');
  
  const comment = await commentRepository.findOne({ where: { id } });
  
  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  
  // Check if user is the author or admin/moderator
  if (req.user.id !== comment.authorId && 
      req.user.role !== 'admin' && 
      req.user.role !== 'moderator') {
    return sendErrorResponse(res, 'Not authorized to update this comment', 403, 'UNAUTHORIZED');
  }
  
  comment.content = content;
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
  
  sendResponse(res, completeComment, 'Comment updated successfully');
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const commentRepository = AppDataSource.getRepository('Comment');
  
  const comment = await commentRepository.findOne({ where: { id } });
  
  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  
  // Check if user is the author or admin/moderator
  if (req.user.id !== comment.authorId && 
      req.user.role !== 'admin' && 
      req.user.role !== 'moderator') {
    return sendErrorResponse(res, 'Not authorized to delete this comment', 403, 'UNAUTHORIZED');
  }
  
  await commentRepository.remove(comment);
  
  sendResponse(res, null, 'Comment deleted successfully');
});

const approveComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const commentRepository = AppDataSource.getRepository('Comment');
  
  const comment = await commentRepository.findOne({ where: { id } });
  
  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  
  comment.isApproved = true;
  const updatedComment = await commentRepository.save(comment);
  
  sendResponse(res, updatedComment, 'Comment approved successfully');
});

const rejectComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const commentRepository = AppDataSource.getRepository('Comment');
  
  const comment = await commentRepository.findOne({ where: { id } });
  
  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  
  comment.isApproved = false;
  const updatedComment = await commentRepository.save(comment);
  
  sendResponse(res, updatedComment, 'Comment rejected successfully');
});

module.exports = {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
};
