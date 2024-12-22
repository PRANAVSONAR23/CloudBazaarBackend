import { Order } from "../models/order.model.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { myCache } from "../app.js";
import errorHandler from "../utils/utility-classes.js";
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
        await invalidateCache({ product: true, order: true, admin: true, userId: user });
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
            orders = await Order.find({ user: id }).populate({ path: 'user', select: '_id' });
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
export const getSingleOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Order id is required"
            });
            return;
        }
        let order;
        if (myCache.has("order-" + id)) {
            order = JSON.parse(myCache.get("order-" + id));
        }
        else {
            order = await Order.findById(id).populate("user", "name email");
            if (!order) {
                next(new errorHandler("Order not found", 404));
                return;
            }
            myCache.set("order-" + id, JSON.stringify(order));
        }
        res.status(200).json({
            success: true,
            order
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
export const processOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Order id is required"
            });
            return;
        }
        const order = await Order.findById(id);
        if (!order) {
            next(new errorHandler("Order not found", 404));
            return;
        }
        switch (order.status) {
            case "Processing":
                order.status = "Shipped";
                break;
            case "Shipped":
                order.status = "Delivered";
                break;
            default:
                order.status = "Delivered";
                break;
        }
        await order.save();
        await invalidateCache({ product: false, order: true, admin: true, userId: order.user, orderId: String(order._id) });
        res.status(200).json({
            success: true,
            message: "Order processed successfully"
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
export const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Order id is required"
            });
            return;
        }
        const order = await Order.findById(id);
        if (!order) {
            next(new errorHandler("Order not found", 404));
            return;
        }
        await order.deleteOne();
        await invalidateCache({ product: false, order: true, admin: true, userId: order.user, orderId: String(order._id) });
        res.status(200).json({
            success: true,
            message: "Order deleted successfully"
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
