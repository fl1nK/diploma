const jwt = require('jsonwebtoken');

const authToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({message: 'Token not found!'})

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403);
        req.user = user;

    });

    next();
};

module.exports = authToken;