import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            // required: true,
        },
        slug: {
            type: String,
        },
        description: {
            type: String,
            // required: true,
        },
        images: [
            {
                type: String,
                // required: true,
            },
        ],
        brand: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            default: 0,
        },
        oldPrice: {
            type: Number,
            default: 0,
        },
        categoryId: {
            type: String,
            default: '',
        },
        categoryName: {
            type: String,
            default: '',
        },
        subCategoryId: {
            type: String,
            default: '',
        },
        subCategoryName: {
            type: String,
            default: '',
        },

        thirdSubCategoryId: {
            type: String,
            default: '',
        },
        thirdSubCategoryName: {
            type: String,
            default: '',
        },
        category: {
            type: mongoose.Schema.ObjectId,
            ref: 'category',
            // required: true,
        },
        countInStock: {
            type: Number,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
        review: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'review',
            },
        ],
        rating: {
            type: Number,
            default: 4,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        discount: {
            type: Number,
            // required: true,
        },
        productRam: [
            {
                type: String,
                default: null,
            },
        ],
        productSize: [
            {
                type: String,
                default: null,
            },
        ],
        productWeight: [
            {
                type: String,
                default: null,
            },
        ],
        dateCreated: {
            type: Date,
            default: Date.now,
        },
        banners: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'banner',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const ProductModel = mongoose.model('product', productSchema);
export default ProductModel;
