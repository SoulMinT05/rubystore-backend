import jwt from 'jsonwebtoken';

const generateAccessToken = async (userId, role) => {
    const token = jwt.sign({ _id: userId, role }, process.env.SECRET_KEY_ACCESS_TOKEN, { expiresIn: '30m' });
    return token;
};

export default generateAccessToken;
