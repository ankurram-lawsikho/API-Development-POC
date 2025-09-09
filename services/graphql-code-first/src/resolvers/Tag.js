const AppDataSource = require('../config/database');
const Tag = require('../models/Tag');
const { generateSlug, sanitizeUser } = require('../utils/helpers');
// GraphQL errors
const AuthenticationError = (message) => new Error(`Authentication Error: ${message}`);
const ForbiddenError = (message) => new Error(`Forbidden Error: ${message}`);
const UserInputError = (message) => new Error(`User Input Error: ${message}`);

const tagResolvers = {
  Query: {
    tag: async (_, { id }) => {
      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({
        where: { id },
        relations: ['posts', 'posts.author'],
      });

      if (!tag) {
        throw new UserInputError('Tag not found');
      }

      // Sanitize post authors
      if (tag.posts) {
        tag.posts.forEach(post => {
          if (post.author) {
            post.author = sanitizeUser(post.author);
          }
        });
      }

      return tag;
    },

    tagBySlug: async (_, { slug }) => {
      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({
        where: { slug },
        relations: ['posts', 'posts.author'],
      });

      if (!tag) {
        throw new UserInputError('Tag not found');
      }

      // Sanitize post authors
      if (tag.posts) {
        tag.posts.forEach(post => {
          if (post.author) {
            post.author = sanitizeUser(post.author);
          }
        });
      }

      return tag;
    },

    tags: async (_, { first = 10, after, filters = {}, orderBy = { field: 'NAME', direction: 'ASC' } }) => {
      const tagRepository = AppDataSource.getRepository(Tag);
      const queryBuilder = tagRepository.createQueryBuilder('tag')
        .leftJoinAndSelect('tag.posts', 'posts');

      // Apply filters
      if (filters.search) {
        queryBuilder.andWhere(
          '(tag.name ILIKE :search OR tag.description ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply ordering
      const orderField = orderBy.field.toLowerCase();
      const orderDirection = orderBy.direction;
      queryBuilder.orderBy(`tag.${orderField}`, orderDirection);

      // Apply pagination
      if (after) {
        if (orderField === 'name') {
          queryBuilder.andWhere('tag.name > :after', { after });
        } else {
          const afterDate = new Date(after);
          queryBuilder.andWhere(`tag.${orderField} > :after`, { after: afterDate });
        }
      }

      const tags = await queryBuilder.limit(first).getMany();

      return {
        edges: tags.map(tag => ({
          node: tag,
          cursor: orderField === 'name' ? tag.name : tag[orderField].toISOString(),
        })),
        pageInfo: {
          hasNextPage: tags.length === first,
          hasPreviousPage: !!after,
          startCursor: orderField === 'name' ? tags[0]?.name : tags[0]?.[orderField].toISOString(),
          endCursor: orderField === 'name' ? tags[tags.length - 1]?.name : tags[tags.length - 1]?.[orderField].toISOString(),
        },
        totalCount: await queryBuilder.getCount(),
      };
    },

    popularTags: async (_, { limit = 10 }) => {
      const tagRepository = AppDataSource.getRepository(Tag);
      
      const tags = await tagRepository
        .createQueryBuilder('tag')
        .leftJoin('tag.posts', 'posts')
        .select('tag.id, tag.name, tag.slug, tag.color, COUNT(posts.id) as postCount')
        .groupBy('tag.id')
        .orderBy('postCount', 'DESC')
        .limit(limit)
        .getRawMany();

      return tags;
    },
  },

  Mutation: {
    createTag: async (_, { input }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      const { name, description, color = '#007bff' } = input;
      const tagRepository = AppDataSource.getRepository(Tag);

      // Check if tag already exists
      const existingTag = await tagRepository.findOne({ where: { name } });
      if (existingTag) {
        throw new UserInputError('Tag with this name already exists');
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
      return savedTag;
    },

    updateTag: async (_, { id, input }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({ where: { id } });

      if (!tag) {
        throw new UserInputError('Tag not found');
      }

      // Check if name is being changed and if it's already taken
      if (input.name && input.name !== tag.name) {
        const existingTag = await tagRepository.findOne({ where: { name: input.name } });
        if (existingTag) {
          throw new UserInputError('Tag with this name already exists');
        }

        // Update slug if name changed
        let slug = generateSlug(input.name);
        let counter = 1;
        let originalSlug = slug;

        while (await tagRepository.findOne({ where: { slug, id: { $ne: id } } })) {
          slug = `${originalSlug}-${counter}`;
          counter++;
        }
        tag.slug = slug;
      }

      // Update fields
      Object.keys(input).forEach(key => {
        if (input[key] !== undefined) {
          tag[key] = input[key];
        }
      });

      const updatedTag = await tagRepository.save(tag);
      return updatedTag;
    },

    deleteTag: async (_, { id }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({
        where: { id },
        relations: ['posts'],
      });

      if (!tag) {
        throw new UserInputError('Tag not found');
      }

      // Check if tag has associated posts
      if (tag.posts && tag.posts.length > 0) {
        throw new UserInputError('Cannot delete tag with associated posts');
      }

      await tagRepository.remove(tag);
      return { success: true };
    },
  },

  Tag: {
    postCount: (tag) => tag.posts ? tag.posts.length : 0,
  },
};

module.exports = tagResolvers;
