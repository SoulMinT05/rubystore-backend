import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
        },
        images: [
            {
                type: String,
                default: '',
            },
        ],
        comment: {
            type: String,
            default: '',
        },
        rating: {
            type: String,
            default: 4,
        },
    },
    {
        timestamps: true,
    },
);

const ReviewModel = mongoose.model('review', reviewSchema);
export default ReviewModel;
