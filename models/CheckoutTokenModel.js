import mongoose from 'mongoose';

const checkoutTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    selectedCartItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
            name: String,
            price: Number,
            oldPrice: Number,
            sizeProduct: String,
            quantityProduct: Number,
            images: [String],
        },
    ],
    totalQuantity: Number,
    totalPrice: Number,
    discountType: String,
    discountValue: Number,
    finalPrice: Number,
    voucher: {
        code: String,
        discountType: String,
        discountValue: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // TTL index được gán ở dưới
    },
});

// TTL index: tự xoá sau 2 tiếng
checkoutTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

const CheckoutTokenModel = mongoose.model('checkoutToken', checkoutTokenSchema);
export default CheckoutTokenModel;
