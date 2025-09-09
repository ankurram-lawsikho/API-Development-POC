const createResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

const createErrorResponse = (message, statusCode = 500, code = 'ERROR') => {
  return {
    success: false,
    statusCode,
    message,
    code,
    timestamp: new Date().toISOString(),
  };
};

const createPaginatedResponse = (data, pagination, message = 'Success') => {
  return {
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};

const sendResponse = (res, data, message, statusCode = 200) => {
  const response = createResponse(data, message, statusCode);
  return res.status(statusCode).json(response);
};

const sendErrorResponse = (res, message, statusCode = 500, code = 'ERROR') => {
  const response = createErrorResponse(message, statusCode, code);
  return res.status(statusCode).json(response);
};

const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = createPaginatedResponse(data, pagination, message);
  return res.status(200).json(response);
};

module.exports = {
  createResponse,
  createErrorResponse,
  createPaginatedResponse,
  sendResponse,
  sendErrorResponse,
  sendPaginatedResponse,
};
