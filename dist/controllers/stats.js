import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { calculatePercentage } from "../utils/features.js";
export const getDashboardStats = async (req, res, next) => {
    try {
        let stats = {};
        if (myCache.has("admin-stats")) {
            stats = JSON.parse(myCache.get("admin-stats"));
        }
        else {
            const today = new Date();
            const currentMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today,
            };
            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0),
            };
            const currentMonthProductsPromise = Product.find({
                createdAt: {
                    $gte: currentMonth.start,
                    $lte: currentMonth.end,
                }
            });
            const lastMonthProductsPromise = Product.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            });
            const currentMonthUsersPromise = User.find({
                createdAt: {
                    $gte: currentMonth.start,
                    $lte: currentMonth.end,
                }
            });
            const lastMonthUsersPromise = User.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            });
            const currentMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: currentMonth.start,
                    $lte: currentMonth.end,
                }
            });
            const lastMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            });
            const [currentMonthProducts, lastMonthProducts, currentMonthUsers, lastMonthUsers, currentMonthOrders, lastMonthOrders, productCount, userCount, allOrders] = await Promise.all([
                currentMonthProductsPromise,
                lastMonthProductsPromise,
                currentMonthUsersPromise,
                lastMonthUsersPromise,
                currentMonthOrdersPromise,
                lastMonthOrdersPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total")
            ]);
            const currentMonthRevenue = currentMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
            const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
            const ChangePercentage = {
                revenue: calculatePercentage(currentMonthRevenue, lastMonthRevenue),
                product: calculatePercentage(currentMonthProducts.length, lastMonthProducts.length),
                user: calculatePercentage(currentMonthUsers.length, lastMonthUsers.length),
                order: calculatePercentage(currentMonthOrders.length, lastMonthOrders.length),
            };
            const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
            const count = {
                revenue,
                product: productCount,
                user: userCount,
                order: allOrders.length,
            };
            stats = { ChangePercentage, count };
        }
        res.status(200).json({
            sucesss: true,
            stats,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
