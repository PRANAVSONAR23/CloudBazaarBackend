import { Schema, model } from "mongoose";
const productSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"]
    },
    price: {
        type: Number,
        required: [true, "Please provide a price"]
    },
    stock: {
        type: Number,
        required: [true, "Please provide a stock"]
    },
    photo: {
        type: String,
        required: [true, "Please provide a photo"]
    },
    category: {
        type: String,
        required: [true, "Please provide a category"]
    }
}, { timestamps: true });
export const Product = model("Product", productSchema);
