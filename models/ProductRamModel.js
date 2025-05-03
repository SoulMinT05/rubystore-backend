import mongoose from 'mongoose';

const productRamSchema = mongoose.Schema(
    {
        name: {
            type: String,
            // required: true,
        },
        dateCreated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

const ProductRamModel = mongoose.model('productRam', productRamSchema);
export default ProductRamModel;
