import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
export const connectDB = (uri) => {
    mongoose.connect(uri, {
        dbName: "Cloudbazaar",
    })
        .then((c) => console.log(`DB connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
};
export const invalidateCache = async ({ product, order, admin }) => {
    if (product) {
        const productKeys = ["latestProducts", "adminProducts", "categories"];
        const products = await Product.find({}).select("_id");
        products.forEach(i => {
            productKeys.push(`product-${i._id}`);
        });
        myCache.del(productKeys);
    }
    if (order) {
        myCache.del("orders");
    }
    if (admin) {
        myCache.del("admin");
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product)
            throw new Error("Product Not Found");
        product.stock -= order.quantity;
        await product.save();
    }
};
