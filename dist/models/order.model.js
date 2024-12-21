import { Schema, model } from 'mongoose';
const orderSchema = new Schema({
    shippingInfo: {
        address: {
            type: String,
            required: [true, "Please provide a address"]
        },
        city: {
            type: String,
            required: [true, "Please provide a city"]
        },
        state: {
            type: String,
            required: [true, "Please provide a state"]
        },
        country: {
            type: String,
            required: [true, "Please provide a country"]
        },
        pincode: {
            type: Number,
            required: [true, "Please provide a pincode"]
        }
    },
    user: {
        type: String,
        ref: "User",
        required: [true, "Please provide a user"]
    },
    subtotal: {
        type: Number,
        required: [true, "Please provide a subtotal"]
    },
    tax: {
        type: Number,
        required: [true, "Please provide a tax"]
    },
    shippingCharges: {
        type: Number,
        required: [true, "Please provide a shippingCharges"]
    },
    discount: {
        type: Number,
        required: [true, "Please provide a discount"]
    },
    total: {
        type: Number,
        required: [true, "Please provide a total"]
    },
    status: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered"],
        default: "Processing"
    },
    orderItems: [
        {
            name: {
                type: String,
                required: [true, "Please provide a name"]
            },
            photo: {
                type: String,
                required: [true, "Please provide a photo"]
            },
            price: {
                type: Number,
                required: [true, "Please provide a price"]
            },
            quantity: {
                type: Number,
                required: [true, "Please provide a quantity"]
            },
            productId: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: [true, "Please provide a productId"]
            }
        }
    ]
}, { timestamps: true });
export const Order = model("Order", orderSchema);
