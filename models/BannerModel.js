import mongoose from 'mongoose';

const bannerSchema = mongoose.Schema(
    {
        name: String,
        images: [String],
        // productId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'product', // nếu cần liên kết tới sản phẩm
        // },
        categoryId: {
            type: String,
            default: '',
        },
        subCategoryId: {
            type: String,
            default: '',
        },
        thirdSubCategoryId: {
            type: String,
            default: '',
        },
        align: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

const BannerModel = mongoose.model('banner', bannerSchema);
export default BannerModel;
