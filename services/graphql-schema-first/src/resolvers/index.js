const AppDataSource = require('../config/database');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Tag = require('../models/Tag');
const { hashPassword, comparePassword, generateToken, generateSlug, sanitizeUser } = require('../utils/helpers');

// GraphQL errors
const AuthenticationError = (message) => new Error(`Authentication Error: ${message}`);
const ForbiddenError = (message) => new Error(`Forbidden Error: ${message}`);
const UserInputError = (message) => new Error(`User Input Error: ${message}`);

const resolvers = {
  // Scalar resolvers
  DateTime: require('../utils/helpers').DateTimeScalar,

  // Query resolvers
  Query: {
    health: () => 'GraphQL Schema-First API is running!',

    // User queries
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

    // Post queries
    post: async (_, { id }) => {
      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({
        where: { id },
        relations: ['author', 'tags', 'comments', 'comments.author'],
      });

      if (!post) {
        throw UserInputError('Post not found');
      }

      // Check if post is published or user is the author/admin
      if (post.status !== 'published' && 
          (!user || (user.id !== post.authorId && user.role !== 'admin'))) {
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

    postBySlug: async (_, { slug }) => {
      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({
        where: { slug },
        relations: ['author', 'tags', 'comments', 'comments.author'],
      });

      if (!post) {
        throw UserInputError('Post not found');
      }

      // Check if post is published or user is the author/admin
      if (post.status !== 'published' && 
          (!user || (user.id !== post.authorId && user.role !== 'admin'))) {
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

    posts: async (_, { first = 10, after, filters = {}, orderBy = { field: 'CREATED_AT', direction: 'DESC' } }) => {
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

    // Comment queries
    comment: async (_, { id }, { user }) => {
      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({
        where: { id },
        relations: ['author', 'post', 'parent', 'replies', 'replies.author'],
      });

      if (!comment) {
        throw UserInputError('Comment not found');
      }

      // Check if comment is approved unless user is admin/moderator
      if (!comment.isApproved && 
          (!user || (user.role !== 'admin' && user.role !== 'moderator'))) {
        throw UserInputError('Comment not found');
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

    // Tag queries
    tag: async (_, { id }) => {
      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({
        where: { id },
        relations: ['posts', 'posts.author'],
      });

      if (!tag) {
        throw UserInputError('Tag not found');
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
        throw UserInputError('Tag not found');
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

  // Mutation resolvers
  Mutation: {
    // User mutations
    register: async (_, { input }) => {
      const { email, password, firstName, lastName } = input;
      const userRepository = AppDataSource.getRepository(User);

      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw UserInputError('User with this email already exists');
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
        throw AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw AuthenticationError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw AuthenticationError('Invalid email or password');
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
        throw AuthenticationError('Authentication required');
      }

      const userRepository = AppDataSource.getRepository(User);

      // Check if email is being changed and if it's already taken
      if (input.email && input.email !== user.email) {
        const existingUser = await userRepository.findOne({ where: { email: input.email } });
        if (existingUser) {
          throw UserInputError('Email already in use');
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
        throw AuthenticationError('Authentication required');
      }

      const { currentPassword, newPassword } = input;
      const userRepository = AppDataSource.getRepository(User);

      // Get current user with password
      const currentUser = await userRepository.findOne({ where: { id: user.id } });

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        throw UserInputError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await userRepository.update(user.id, { password: hashedNewPassword });

      return { success: true, message: 'Password changed successfully' };
    },

    deactivateAccount: async (_, __, { user }) => {
      if (!user) {
        throw AuthenticationError('Authentication required');
      }

      const userRepository = AppDataSource.getRepository(User);
      await userRepository.update(user.id, { isActive: false });

      return { success: true, message: 'Account deactivated successfully' };
    },

    // Post mutations
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
        throw AuthenticationError('Authentication required');
      }

      const postRepository = AppDataSource.getRepository(Post);
      const tagRepository = AppDataSource.getRepository(Tag);

      const post = await postRepository.findOne({
        where: { id },
        relations: ['tags'],
      });

      if (!post) {
        throw UserInputError('Post not found');
      }

      // Check if user is the author or admin
      if (user.id !== post.authorId && user.role !== 'admin') {
        throw ForbiddenError('Not authorized to update this post');
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
        throw AuthenticationError('Authentication required');
      }

      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({ where: { id } });

      if (!post) {
        throw UserInputError('Post not found');
      }

      // Check if user is the author or admin
      if (user.id !== post.authorId && user.role !== 'admin') {
        throw ForbiddenError('Not authorized to delete this post');
      }

      await postRepository.remove(post);
      return { success: true, message: 'Post deleted successfully' };
    },

    publishPost: async (_, { id }, { user }) => {
      if (!user) {
        throw AuthenticationError('Authentication required');
      }

      const postRepository = AppDataSource.getRepository(Post);
      const post = await postRepository.findOne({ where: { id } });

      if (!post) {
        throw UserInputError('Post not found');
      }

      // Check if user is the author or admin
      if (user.id !== post.authorId && user.role !== 'admin') {
        throw ForbiddenError('Not authorized to publish this post');
      }

      post.status = 'published';
      post.publishedAt = new Date();

      const updatedPost = await postRepository.save(post);
      return updatedPost;
    },

    // Comment mutations
    createComment: async (_, { input }) => {
      const { content, postId, parentId } = input;
      const commentRepository = AppDataSource.getRepository(Comment);
      const postRepository = AppDataSource.getRepository(Post);

      // Check if post exists
      const post = await postRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw UserInputError('Post not found');
      }

      // Check if parent comment exists (for replies)
      if (parentId) {
        const parentComment = await commentRepository.findOne({ where: { id: parentId } });
        if (!parentComment) {
          throw UserInputError('Parent comment not found');
        }
      }

      // Create comment
      const comment = commentRepository.create({
        content,
        authorId: 'demo-user-1',
        postId,
        parentId: parentId || null,
        isApproved: true, // Auto-approve for demo
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
        throw AuthenticationError('Authentication required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw UserInputError('Comment not found');
      }

      // Check if user is the author or admin/moderator
      if (user.id !== comment.authorId && 
          user.role !== 'admin' && 
          user.role !== 'moderator') {
        throw ForbiddenError('Not authorized to update this comment');
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
        throw AuthenticationError('Authentication required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw UserInputError('Comment not found');
      }

      // Check if user is the author or admin/moderator
      if (user.id !== comment.authorId && 
          user.role !== 'admin' && 
          user.role !== 'moderator') {
        throw ForbiddenError('Not authorized to delete this comment');
      }

      await commentRepository.remove(comment);
      return { success: true, message: 'Comment deleted successfully' };
    },

    approveComment: async (_, { id }, { user }) => {
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        throw ForbiddenError('Admin or moderator access required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw UserInputError('Comment not found');
      }

      comment.isApproved = true;
      const updatedComment = await commentRepository.save(comment);

      return updatedComment;
    },

    rejectComment: async (_, { id }, { user }) => {
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        throw ForbiddenError('Admin or moderator access required');
      }

      const commentRepository = AppDataSource.getRepository(Comment);
      const comment = await commentRepository.findOne({ where: { id } });

      if (!comment) {
        throw UserInputError('Comment not found');
      }

      comment.isApproved = false;
      const updatedComment = await commentRepository.save(comment);

      return updatedComment;
    },

    // Tag mutations
    createTag: async (_, { input }) => {
      const { name, description, color = '#007bff' } = input;
      const tagRepository = AppDataSource.getRepository(Tag);

      // Check if tag already exists
      const existingTag = await tagRepository.findOne({ where: { name } });
      if (existingTag) {
        throw UserInputError('Tag with this name already exists');
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
        throw ForbiddenError('Admin access required');
      }

      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({ where: { id } });

      if (!tag) {
        throw UserInputError('Tag not found');
      }

      // Check if name is being changed and if it's already taken
      if (input.name && input.name !== tag.name) {
        const existingTag = await tagRepository.findOne({ where: { name: input.name } });
        if (existingTag) {
          throw UserInputError('Tag with this name already exists');
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
        throw ForbiddenError('Admin access required');
      }

      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({
        where: { id },
        relations: ['posts'],
      });

      if (!tag) {
        throw UserInputError('Tag not found');
      }

      // Check if tag has associated posts
      if (tag.posts && tag.posts.length > 0) {
        throw UserInputError('Cannot delete tag with associated posts');
      }

      await tagRepository.remove(tag);
      return { success: true, message: 'Tag deleted successfully' };
    },
  },

  // Type resolvers
  User: {
    fullName: (user) => `${user.firstName} ${user.lastName}`,
    postCount: (user) => user.posts ? user.posts.length : 0,
    commentCount: (user) => user.comments ? user.comments.length : 0,
  },

  Post: {
    commentCount: (post) => post.comments ? post.comments.length : 0,
  },

  Comment: {
    replyCount: (comment) => comment.replies ? comment.replies.length : 0,
  },

  Tag: {
    postCount: (tag) => tag.posts ? tag.posts.length : 0,
  },
};

module.exports = resolvers;
