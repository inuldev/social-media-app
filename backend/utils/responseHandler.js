const response = (res, statusCode, message, data = null) => {
  const responseObject = {
    status: statusCode < 400 ? "success" : "error",
    message: message || "An error occurred",
    data: data,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(responseObject);
};

module.exports = { response };
