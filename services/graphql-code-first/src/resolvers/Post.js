const AppDataSource = require('../config/database');
const Post = require('../models/Post');
const User = require('../models/User');
const Tag = require('../models/Tag');
const { generateSlug, sanitizeUser } = require('../utils/helpers');
// GraphQL errors
const AuthenticationError = (message) => new Error(`Authentication Error: ${message}`);
const ForbiddenError = (message) => new Error(`Forbidden Error: ${message}`);
const UserInputError = (message) => new Error(`User Input Error: ${message}`);

const postResolvers = {
  Query: {
    post: async (_, { id }) => {
      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({
        where: { id },
        relations: ['author', 'tags', 'comments', 'comments.author'],
      });

      if (!post) {
        throw UserInputError('Post not found');
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

      return post;
    },

    postBySlug: async (_, { slug }, { user }) => {
      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({
        where: { slug },
        relations: ['author', 'tags', 'comments', 'comments.author'],
      });

      if (!post) {
        throw new UserInputError('Post not found');
      }

      // Check if post is published or user is the author/admin
      if (post.status !== 'published' && 
          (!user || (user.id !== post.authorId && user.role !== 'admin'))) {
        throw new UserInputError('Post not found');
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

      return post;
    },

    posts: async (_, { first = 10, after, filters = {}, orderBy = { field: 'CREATED_AT', direction: 'DESC' } }, { user }) => {
      const postRepository = AppDataSource.getRepository(Post);
      const queryBuilder = postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .leftJoinAndSelect('post.comments', 'comments');

      // Apply filters
      if (filters.status) {
        queryBuilder.andWhere('post.status = :status', { status: filters.status });
      } else if (!user || user.role !== 'admin') {
        // Only show published posts to non-admin users
        queryBuilder.andWhere('post.status = :status', { status: 'published' });
      }

      if (filters.authorId) {
        queryBuilder.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
      }

      if (filters.tagId) {
        queryBuilder.andWhere('tags.id = :tagId', { tagId: filters.tagId });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(post.title ILIKE :search OR post.content ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply ordering
      const orderField = orderBy.field.toLowerCase();
      const orderDirection = orderBy.direction;
      queryBuilder.orderBy(`post.${orderField}`, orderDirection);

      // Apply pagination
      if (after) {
        const afterDate = new Date(after);
        queryBuilder.andWhere(`post.${orderField} < :after`, { after: afterDate });
      }

      const posts = await queryBuilder.limit(first).getMany();

      // Sanitize author data
      posts.forEach(post => {
        if (post.author) {
          post.author = sanitizeUser(post.author);
        }
      });

      return {
        edges: posts.map(post => ({
          node: post,
          cursor: post[orderField].toISOString(),
        })),
        pageInfo: {
          hasNextPage: posts.length === first,
          hasPreviousPage: !!after,
          startCursor: posts[0]?.[orderField].toISOString(),
          endCursor: posts[posts.length - 1]?.[orderField].toISOString(),
        },
        totalCount: await queryBuilder.getCount(),
      };
    },
  },

  Mutation: {
    createPost: async (_, { input }) => {
      const { title, content, excerpt, featuredImage, status = 'draft', tagIds = [] } = input;
      const postRepository = AppDataSource.getRepository(Post);
      const tagRepository = AppDataSource.getRepository(Tag);

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
        excerpt,
        featuredImage,
        slug,
        status,
        authorId: 'demo-user-1',
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

      return completePost;
    },

    updatePost: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const postRepository = AppDataSource.getRepository(Post);
      const tagRepository = AppDataSource.getRepository(Tag);

      const post = await postRepository.findOne({
        where: { id },
        relations: ['tags'],
      });

      if (!post) {
        throw new UserInputError('Post not found');
      }

      // Check if user is the author or admin
      if (user.id !== post.authorId && user.role !== 'admin') {
        throw new ForbiddenError('Not authorized to update this post');
      }

      // Update slug if title changed
      if (input.title && input.title !== post.title) {
        let slug = generateSlug(input.title);
        let counter = 1;
        let originalSlug = slug;

        while (await postRepository.findOne({ where: { slug, id: { $ne: id } } })) {
          slug = `${originalSlug}-${counter}`;
          counter++;
        }
        post.slug = slug;
      }

      // Update fields
      Object.keys(input).forEach(key => {
        if (input[key] !== undefined) {
          post[key] = input[key];
        }
      });

      // Handle status change
      if (input.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }

      // Update tags
      if (input.tagIds !== undefined) {
        const tags = input.tagIds.length > 0 ? await tagRepository.findByIds(input.tagIds) : [];
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

      return completePost;
    },

    deletePost: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({ where: { id } });

      if (!post) {
        throw new UserInputError('Post not found');
      }

      // Check if user is the author or admin
      if (user.id !== post.authorId && user.role !== 'admin') {
        throw new ForbiddenError('Not authorized to delete this post');
      }

      await postRepository.remove(post);
      return { success: true };
    },

    publishPost: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({ where: { id } });

      if (!post) {
        throw new UserInputError('Post not found');
      }

      // Check if user is the author or admin
      if (user.id !== post.authorId && user.role !== 'admin') {
        throw new ForbiddenError('Not authorized to publish this post');
      }

      post.status = 'published';
      post.publishedAt = new Date();

      const updatedPost = await postRepository.save(post);
      return updatedPost;
    },
  },

  Post: {
    commentCount: (post) => post.comments ? post.comments.length : 0,
  },
};

module.exports = postResolvers;
