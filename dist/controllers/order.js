import { Order } from "../models/order.model.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { myCache } from "../app.js";
export const newOrder = async (req, res, next) => {
    try {
        const { shippingInfo, user, subtotal, tax, shippingCharges, discount, total, orderItems } = req.body;
        if (!shippingInfo || !user || !subtotal || !tax || !shippingCharges || !discount || !total || !orderItems) {
            res.status(400).json({
                success: false,
                message: "All fields are required"
            });
            return;
        }
        await Order.create({ shippingInfo, user, subtotal, tax, shippingCharges, discount, total, orderItems });
        await reduceStock(orderItems);
        await invalidateCache({ product: true, order: true, admin: true });
        res.status(201).json({
            success: true,
            message: "Order placed successfully"
        });
        return;
    }
    catch (err) {
        res.status(500).json({
            success: false,
        });
        return;
    }
};
export const myOrders = async (req, res, next) => {
    try {
        const { id } = req.query;
        console.log("order params:", req.query);
        if (!id) {
            res.status(400).json({
                success: false,
                message: "User id is required"
            });
            return;
        }
        let orders = [];
        if (myCache.has("myOrders-" + id)) {
            console.log("cache hit");
            orders = JSON.parse(myCache.get("myOrders-" + id));
        }
        else {
            console.log("Searching for orders with user:", id);
            orders = await Order.find({ user: id });
            console.log("orders:", orders);
            if (orders.length > 0) {
                myCache.set(`myOrders-${id}`, JSON.stringify(orders));
            }
        }
        res.status(200).json({
            success: true,
            orders
        });
        return;
    }
    catch (err) {
        res.status(500).json({
            success: false,
        });
        return;
    }
};
export const allOrders = async (req, res, next) => {
    try {
        let orders = [];
        if (myCache.has("allOrders")) {
            orders = JSON.parse(myCache.get("allOrders"));
        }
        else {
            orders = await Order.find().populate("user", "name email");
            myCache.set("allOrders", JSON.stringify(orders));
        }
        res.status(200).json({
            success: true,
            orders
        });
        return;
    }
    catch (err) {
        res.status(500).json({
            success: false,
        });
        return;
    }
};
