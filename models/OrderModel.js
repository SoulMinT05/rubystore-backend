import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
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
        shippingAddress: {
            streetLine: { type: String, required: true },
            city: { type: String, required: true },
            district: { type: String, required: true },
            ward: { type: String, required: true },
            country: { type: String, default: 'Việt Nam' },
        },
        totalQuantity: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        discountType: String, // optional
        discountValue: Number, // optional
        finalPrice: { type: Number, required: true },
        voucher: {
            code: String,
            discountType: String,
            discountValue: Number,
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'momo', 'vnpay'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded', 'failed'],
            default: 'unpaid',
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
        },
        shippingFee: {
            type: Number,
            default: 0,
        },
        note: {
            type: String,
            default: '',
        },
        deliveredAt: {
            type: Date,
        },
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const OrderModel = mongoose.model('order', orderSchema);
export default OrderModel;
