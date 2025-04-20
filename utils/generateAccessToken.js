import jwt from 'jsonwebtoken';

const generateAccessToken = async (userId, role) => {
    const token = await jwt.sign({ _id: userId, role }, process.env.SECRET_KEY_ACCESS_TOKEN, { expiresIn: '5h' });
    return token;
};

export default generateAccessToken;
