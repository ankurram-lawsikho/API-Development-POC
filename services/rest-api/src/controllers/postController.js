const { AppDataSource } = require('../config/database');
const { generateSlug, getPaginationParams, buildPaginationInfo, sanitizeUser } = require('../utils/helpers');
const { sendResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const createPost = asyncHandler(async (req, res) => {
  const { title, content, status = 'draft', tagIds = [] } = req.body;
  const postRepository = AppDataSource.getRepository('Post');
  const tagRepository = AppDataSource.getRepository('Tag');
  
  // Generate unique slug
  let slug = generateSlug(title);
  let counter = 1;
  let originalSlug = slug;
  
  while (await postRepository.findOne({ where: { slug } })) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  
  // Create post
  const post = postRepository.create({
    title,
    content,
    slug,
    status,
    authorId: req.user.id,
    publishedAt: status === 'published' ? new Date() : null,
  });
  
  // Add tags if provided
  if (tagIds.length > 0) {
    const tags = await tagRepository.findByIds(tagIds);
    post.tags = tags;
  }
  
  const savedPost = await postRepository.save(post);
  
  // Fetch complete post with relations
  const completePost = await postRepository.findOne({
    where: { id: savedPost.id },
    relations: ['author', 'tags', 'comments'],
  });
  
  // Sanitize author data
  if (completePost.author) {
    completePost.author = sanitizeUser(completePost.author);
  }
  
  sendResponse(res, completePost, 'Post created successfully', 201);
});

const getPosts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { sort = 'createdAt', order = 'DESC', status, tag, q } = req.query;
  
  const postRepository = AppDataSource.getRepository('Post');
  const queryBuilder = postRepository.createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.tags', 'tags')
    .leftJoinAndSelect('post.comments', 'comments')
    .orderBy(`post.${sort}`, order);
  
  // Apply filters
  if (status) {
    queryBuilder.andWhere('post.status = :status', { status });
  }
  
  if (tag) {
    queryBuilder.andWhere('tags.id = :tagId', { tagId: tag });
  }
  
  if (q) {
    queryBuilder.andWhere(
      '(post.title ILIKE :search OR post.content ILIKE :search)',
      { search: `%${q}%` }
    );
  }
  
  // Get total count
  const total = await queryBuilder.getCount();
  
  // Apply pagination
  const posts = await queryBuilder
    .skip(offset)
    .take(limit)
    .getMany();
  
  // Sanitize author data
  posts.forEach(post => {
    if (post.author) {
      post.author = sanitizeUser(post.author);
    }
  });
  
  const pagination = buildPaginationInfo(page, limit, total);
  
  sendPaginatedResponse(res, posts, pagination, 'Posts retrieved successfully');
});

const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postRepository = AppDataSource.getRepository('Post');
  
  const post = await postRepository.findOne({
    where: { id },
    relations: ['author', 'tags', 'comments', 'comments.author'],
  });
  
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Check if post is published or user is the author/admin
  if (post.status !== 'published' && 
      (!req.user || (req.user.id !== post.authorId && req.user.role !== 'admin'))) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Sanitize author data
  if (post.author) {
    post.author = sanitizeUser(post.author);
  }
  
  // Sanitize comment authors
  if (post.comments) {
    post.comments.forEach(comment => {
      if (comment.author) {
        comment.author = sanitizeUser(comment.author);
      }
    });
  }
  
  sendResponse(res, post, 'Post retrieved successfully');
});

const getPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const postRepository = AppDataSource.getRepository('Post');
  
  const post = await postRepository.findOne({
    where: { slug },
    relations: ['author', 'tags', 'comments', 'comments.author'],
  });
  
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Check if post is published or user is the author/admin
  if (post.status !== 'published' && 
      (!req.user || (req.user.id !== post.authorId && req.user.role !== 'admin'))) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Sanitize author data
  if (post.author) {
    post.author = sanitizeUser(post.author);
  }
  
  // Sanitize comment authors
  if (post.comments) {
    post.comments.forEach(comment => {
      if (comment.author) {
        comment.author = sanitizeUser(comment.author);
      }
    });
  }
  
  sendResponse(res, post, 'Post retrieved successfully');
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, status, tagIds } = req.body;
  const postRepository = AppDataSource.getRepository('Post');
  const tagRepository = AppDataSource.getRepository('Tag');
  
  const post = await postRepository.findOne({
    where: { id },
    relations: ['tags'],
  });
  
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Check if user is the author or admin
  if (req.user.id !== post.authorId && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to update this post', 403, 'UNAUTHORIZED');
  }
  
  // Update slug if title changed
  if (title && title !== post.title) {
    let slug = generateSlug(title);
    let counter = 1;
    let originalSlug = slug;
    
    while (await postRepository.findOne({ where: { slug, id: { $ne: id } } })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    post.slug = slug;
  }
  
  // Update fields
  if (title) post.title = title;
  if (content) post.content = content;
  if (status) {
    post.status = status;
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
  }
  
  // Update tags
  if (tagIds !== undefined) {
    const tags = tagIds.length > 0 ? await tagRepository.findByIds(tagIds) : [];
    post.tags = tags;
  }
  
  const updatedPost = await postRepository.save(post);
  
  // Fetch complete post with relations
  const completePost = await postRepository.findOne({
    where: { id: updatedPost.id },
    relations: ['author', 'tags', 'comments'],
  });
  
  // Sanitize author data
  if (completePost.author) {
    completePost.author = sanitizeUser(completePost.author);
  }
  
  sendResponse(res, completePost, 'Post updated successfully');
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postRepository = AppDataSource.getRepository('Post');
  
  const post = await postRepository.findOne({ where: { id } });
  
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Check if user is the author or admin
  if (req.user.id !== post.authorId && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to delete this post', 403, 'UNAUTHORIZED');
  }
  
  await postRepository.remove(post);
  
  sendResponse(res, null, 'Post deleted successfully');
});

const publishPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postRepository = AppDataSource.getRepository('Post');
  
  const post = await postRepository.findOne({ where: { id } });
  
  if (!post) {
    return sendErrorResponse(res, 'Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Check if user is the author or admin
  if (req.user.id !== post.authorId && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to publish this post', 403, 'UNAUTHORIZED');
  }
  
  post.status = 'published';
  post.publishedAt = new Date();
  
  const updatedPost = await postRepository.save(post);
  
  sendResponse(res, updatedPost, 'Post published successfully');
});

module.exports = {
  createPost,
  getPosts,
  getPost,
  getPostBySlug,
  updatePost,
  deletePost,
  publishPost,
};