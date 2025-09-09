const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Validation failed',
        message: errorMessage,
        code: 'VALIDATION_ERROR'
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Query validation failed',
        message: errorMessage,
        code: 'QUERY_VALIDATION_ERROR'
      });
    }
    
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Parameter validation failed',
        message: errorMessage,
        code: 'PARAM_VALIDATION_ERROR'
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
    }),
    
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
    
    update: Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      email: Joi.string().email(),
    }),
  },
  
  post: {
    create: Joi.object({
      title: Joi.string().min(5).max(200).required(),
      content: Joi.string().min(10).required(),
      status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
      tagIds: Joi.array().items(Joi.string().uuid()),
    }),
    
    update: Joi.object({
      title: Joi.string().min(5).max(200),
      content: Joi.string().min(10),
      status: Joi.string().valid('draft', 'published', 'archived'),
      tagIds: Joi.array().items(Joi.string().uuid()),
    }),
  },
  
  comment: {
    create: Joi.object({
      content: Joi.string().min(1).max(1000).required(),
      parentId: Joi.string().uuid().allow(null),
    }),
    
    update: Joi.object({
      content: Joi.string().min(1).max(1000).required(),
    }),
  },
  
  tag: {
    create: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      description: Joi.string().max(200),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#007bff'),
    }),
    
    update: Joi.object({
      name: Joi.string().min(2).max(50),
      description: Joi.string().max(200),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    }),
  },
  
  query: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().valid('createdAt', 'updatedAt', 'title', 'name').default('createdAt'),
      order: Joi.string().valid('ASC', 'DESC').default('DESC'),
    }),
    
    search: Joi.object({
      q: Joi.string().min(1).max(100),
      status: Joi.string().valid('draft', 'published', 'archived'),
      tag: Joi.string().uuid(),
    }),
  },
  
  params: {
    id: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  },
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
};
