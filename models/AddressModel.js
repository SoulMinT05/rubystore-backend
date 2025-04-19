import mongoose from 'mongoose';

const addressSchema = mongoose.Schema(
    {
        addressLine: {
            type: String,
            default: '',
        },
        city: {
            type: String,
            default: '',
        },
        district: {
            type: String,
            default: '',
        },
        ward: {
            type: String,
            default: '',
        },
        country: {
            type: String,
            default: '',
        },
        phoneNumber: {
            type: Number,
            default: null,
        },
        status: {
            type: Boolean,
            default: false,
        },
        userId: {
            type: mongoose.Schema.ObjectId,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);

const AddressModel = mongoose.model('Address', addressSchema);
export default AddressModel;
