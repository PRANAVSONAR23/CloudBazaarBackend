import { Schema, model } from 'mongoose';
const couponSchema = new Schema({
    code: {
        type: String,
        required: [true, "Please provide a code name"],
        unique: true,
        trim: true,
        maxLength: [20, "code name cannot exceed 20 characters"]
    },
    amount: {
        type: Number,
        required: [true, "Please provide a amount"]
    },
    expiry: {
        type: Date
    },
}, { timestamps: true });
export const Coupon = model("Coupon", couponSchema);
