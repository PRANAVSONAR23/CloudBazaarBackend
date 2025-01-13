import {Schema,model} from "mongoose";

const productSchema = new Schema({
    name: {
        type: String,
        required: [true,"Please provide a name"]
    },
    price: {
        type: Number,
        required: [true,"Please provide a price"]
    },
    stock: {
        type: Number,
        required: [true,"Please provide a stock"]
    },
    photos: [{
        public_id: {
            type: String,
            required: [true,"Please provide a public id"]
        },
        url: {
            type: String,
            required: [true,"Please provide url"]
        },
    }],
    category: {
        type: String,
        required: [true,"Please provide a category"]
    }
},{timestamps:true});

export const Product = model("Product", productSchema);

