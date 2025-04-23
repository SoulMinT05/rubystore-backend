import jwt from 'jsonwebtoken';
import UserModel from '../models/UserModel.js';

const generateRefreshToken = async (userId) => {
    const token = jwt.sign({ _id: userId }, process.env.SECRET_KEY_REFRESH_TOKEN, { expiresIn: '7d' });

    await UserModel.updateOne(
        {
            _id: userId,
        },
        {
            refreshToken: token,
        },
    );
    return token;
};

export default generateRefreshToken;
