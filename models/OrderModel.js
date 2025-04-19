import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
    {
        orderId: [
            {
                type: String,
                required: [true, 'Provide orderId'],
                unique: true,
            },
        ],
        userId: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'user',
            },
        ],
        productId: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'product',
            },
        ],
        productDetails: {
            name: String,
            image: Array,
        },
        paymentMethod: {
            type: String,
            default: '',
        },
        paymentStatus: {
            type: String,
            default: '',
        },
        deliveryAddress: {
            type: mongoose.type.ObjectId,
            ref: 'address',
        },
        subTotalAmount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

const OrderModel = mongoose.model('Order', orderSchema);
export default OrderModel;
