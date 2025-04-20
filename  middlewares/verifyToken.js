import jwt from 'jsonwebtoken';

const verifyAccessToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (req?.headers?.authorization.startsWith('Bearer')) {
            const accessToken = token.split(' ')[1];
            jwt.verify(accessToken, process.env.SECRET_KEY_ACCESS_TOKEN, (err, user) => {
                if (err) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid access token',
                    });
                }
                req.user = user;
                next();
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Not verify access token. Require authentication',
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const checkIsStaff = async (req, res, next) => {
    try {
        const { role } = req.user;
        if (role !== 'staff') {
            res.status(401).json({
                success: false,
                message: 'Cần có quyền quản lý để truy cập!',
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const checkIsAdmin = async (req, res, next) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            res.status(401).json({
                success: false,
                message: 'Cần có quyền quản lý để truy cập!',
            });
        } else {
            next();
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const checkAdminOrStaff = (req, res, next) => {
    try {
        const { role } = req.user;

        if (role === 'admin' || role === 'staff') {
            next();
        } else {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền để truy cập vào.' });
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

export { verifyAccessToken, checkIsStaff, checkIsAdmin, checkAdminOrStaff };
