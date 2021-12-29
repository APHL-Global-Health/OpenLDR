const jwt = require("jsonwebtoken");

const config = process.env;

const fetchToken = (req) => {
  const authHeader = String(req.headers['authorization'] || '');
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7, authHeader.length);
  }
  else {
    return req.body.token || req.query.token || req.headers["x-access-token"];
  }
};

const verifyToken = (req, res, next) => {
  const token = fetchToken(req);

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};


module.exports = verifyToken;