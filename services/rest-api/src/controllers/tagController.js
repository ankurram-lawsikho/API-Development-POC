const { AppDataSource } = require('../config/database');
const { generateSlug, getPaginationParams, buildPaginationInfo } = require('../utils/helpers');
const { sendResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const createTag = asyncHandler(async (req, res) => {
  const { name, description, color = '#007bff' } = req.body;
  const tagRepository = AppDataSource.getRepository('Tag');
  
  // Check if tag already exists
  const existingTag = await tagRepository.findOne({ where: { name } });
  if (existingTag) {
    return sendErrorResponse(res, 'Tag with this name already exists', 409, 'TAG_EXISTS');
  }
  
  // Generate unique slug
  let slug = generateSlug(name);
  let counter = 1;
  let originalSlug = slug;
  
  while (await tagRepository.findOne({ where: { slug } })) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  
  // Create tag
  const tag = tagRepository.create({
    name,
    slug,
    description,
    color,
  });
  
  const savedTag = await tagRepository.save(tag);
  
  sendResponse(res, savedTag, 'Tag created successfully', 201);
});

const getTags = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { sort = 'name', order = 'ASC', q } = req.query;
  
  const tagRepository = AppDataSource.getRepository('Tag');
  const queryBuilder = tagRepository.createQueryBuilder('tag')
    .leftJoinAndSelect('tag.posts', 'posts')
    .orderBy(`tag.${sort}`, order);
  
  // Apply search filter
  if (q) {
    queryBuilder.andWhere(
      '(tag.name ILIKE :search OR tag.description ILIKE :search)',
      { search: `%${q}%` }
    );
  }
  
  // Get total count
  const total = await queryBuilder.getCount();
  
  // Apply pagination
  const tags = await queryBuilder
    .skip(offset)
    .take(limit)
    .getMany();
  
  // Add post count to each tag
  tags.forEach(tag => {
    tag.postCount = tag.posts ? tag.posts.length : 0;
    delete tag.posts; // Remove posts array to keep response clean
  });
  
  const pagination = buildPaginationInfo(page, limit, total);
  
  sendPaginatedResponse(res, tags, pagination, 'Tags retrieved successfully');
});

const getTag = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tagRepository = AppDataSource.getRepository('Tag');
  
  const tag = await tagRepository.findOne({
    where: { id },
    relations: ['posts', 'posts.author'],
  });
  
  if (!tag) {
    return sendErrorResponse(res, 'Tag not found', 404, 'TAG_NOT_FOUND');
  }
  
  // Sanitize post authors
  if (tag.posts) {
    tag.posts.forEach(post => {
      if (post.author) {
        const { password, ...sanitizedAuthor } = post.author;
        post.author = sanitizedAuthor;
      }
    });
  }
  
  sendResponse(res, tag, 'Tag retrieved successfully');
});

const getTagBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const tagRepository = AppDataSource.getRepository('Tag');
  
  const tag = await tagRepository.findOne({
    where: { slug },
    relations: ['posts', 'posts.author'],
  });
  
  if (!tag) {
    return sendErrorResponse(res, 'Tag not found', 404, 'TAG_NOT_FOUND');
  }
  
  // Sanitize post authors
  if (tag.posts) {
    tag.posts.forEach(post => {
      if (post.author) {
        const { password, ...sanitizedAuthor } = post.author;
        post.author = sanitizedAuthor;
      }
    });
  }
  
  sendResponse(res, tag, 'Tag retrieved successfully');
});

const updateTag = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  const tagRepository = AppDataSource.getRepository('Tag');
  
  const tag = await tagRepository.findOne({ where: { id } });
  
  if (!tag) {
    return sendErrorResponse(res, 'Tag not found', 404, 'TAG_NOT_FOUND');
  }
  
  // Check if name is being changed and if it's already taken
  if (name && name !== tag.name) {
    const existingTag = await tagRepository.findOne({ where: { name } });
    if (existingTag) {
      return sendErrorResponse(res, 'Tag with this name already exists', 409, 'TAG_EXISTS');
    }
    
    // Update slug if name changed
    let slug = generateSlug(name);
    let counter = 1;
    let originalSlug = slug;
    
    while (await tagRepository.findOne({ where: { slug, id: { $ne: id } } })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    tag.slug = slug;
  }
  
  // Update fields
  if (name) tag.name = name;
  if (description !== undefined) tag.description = description;
  if (color) tag.color = color;
  
  const updatedTag = await tagRepository.save(tag);
  
  sendResponse(res, updatedTag, 'Tag updated successfully');
});

const deleteTag = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tagRepository = AppDataSource.getRepository('Tag');
  
  const tag = await tagRepository.findOne({
    where: { id },
    relations: ['posts'],
  });
  
  if (!tag) {
    return sendErrorResponse(res, 'Tag not found', 404, 'TAG_NOT_FOUND');
  }
  
  // Check if tag has associated posts
  if (tag.posts && tag.posts.length > 0) {
    return sendErrorResponse(res, 'Cannot delete tag with associated posts', 400, 'TAG_HAS_POSTS');
  }
  
  await tagRepository.remove(tag);
  
  sendResponse(res, null, 'Tag deleted successfully');
});

const getPopularTags = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const tagRepository = AppDataSource.getRepository('Tag');
  
  const tags = await tagRepository
    .createQueryBuilder('tag')
    .leftJoin('tag.posts', 'posts')
    .select('tag.id, tag.name, tag.slug, tag.color, COUNT(posts.id) as postCount')
    .groupBy('tag.id')
    .orderBy('postCount', 'DESC')
    .limit(parseInt(limit))
    .getRawMany();
  
  sendResponse(res, tags, 'Popular tags retrieved successfully');
});

module.exports = {
  createTag,
  getTags,
  getTag,
  getTagBySlug,
  updateTag,
  deleteTag,
  getPopularTags,
};
