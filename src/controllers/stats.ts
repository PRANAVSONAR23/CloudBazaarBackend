import { NextFunction, Request, Response } from "express";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { calculatePercentage } from "../utils/features.js";


export const getDashboardStats = async (req: Request, res: Response,next:NextFunction) => {
    try {
        let stats={};

        if(myCache.has("admin-stats")) {
            stats = JSON.parse(myCache.get("admin-stats") as string);
        }
        else {
            const today = new Date();

            const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const currentMonth={
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today,
            }

            const lastMonth={
                start: new Date(today.getFullYear(), today.getMonth()-1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0),
            }

            const currentMonthProductsPromise= Product.find({
                createdAt:{
                    $gte: currentMonth.start,
                    $lte: currentMonth.end,
                }
            })
            const lastMonthProductsPromise= Product.find({
                createdAt:{
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const currentMonthUsersPromise= User.find({
                createdAt:{
                    $gte: currentMonth.start,
                    $lte: currentMonth.end,
                }
            })
            const lastMonthUsersPromise= User.find({
                createdAt:{
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const currentMonthOrdersPromise= Order.find({
                createdAt:{
                    $gte: currentMonth.start,
                    $lte: currentMonth.end,
                }
            })
            const lastMonthOrdersPromise= Order.find({
                createdAt:{
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const lastSixMonthsOrdersPromise= Order.find({
                createdAt:{
                    $gte: sixMonthsAgo,
                    $lte: today,
                }
            })

            const latestTransactionsPromise= Order.find({}).select(['orderItems','discount','total','status']).limit(4);

            const [
                currentMonthProducts,
                lastMonthProducts,
                currentMonthUsers,
                lastMonthUsers,
                currentMonthOrders,
                lastMonthOrders,
                productCount,
                userCount,
                allOrders,
                lastSixMonthsOrders,
                categories,
                femaleUserCount,
                latestTransactions
            ] = await Promise.all([
                currentMonthProductsPromise,
                lastMonthProductsPromise,
                currentMonthUsersPromise,
                lastMonthUsersPromise,
                currentMonthOrdersPromise,
                lastMonthOrdersPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total"),
                lastSixMonthsOrdersPromise,
                Product.distinct("category"),
                User.countDocuments({gender:"female"}),
                latestTransactionsPromise
            ])

            const currentMonthRevenue = currentMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
            const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);

            const ChangePercentage={
                revenue:calculatePercentage(currentMonthRevenue, lastMonthRevenue),
                product:calculatePercentage(currentMonthProducts.length,lastMonthProducts.length),
                user:calculatePercentage(currentMonthUsers.length, lastMonthUsers.length),
                order:calculatePercentage(currentMonthOrders.length, lastMonthOrders.length),
            }

            const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);

            const count={
                revenue,
                product:productCount,
                user:userCount,
                order:allOrders.length,
            }

            const orderMonthCounts = new Array(6).fill(0);
            const orderMonthyRevenue = new Array(6).fill(0);


            lastSixMonthsOrders.forEach((order) => {
                const creationdDate = order.createdAt;
                const monthDiff= today.getMonth() - creationdDate.getMonth();

                if(monthDiff<6){
                    orderMonthCounts[5-monthDiff]++;
                    orderMonthyRevenue[5-monthDiff]+=order.total;
                }
                
            });

            const categoriesCountPromise=categories.map((category)=>
                Product.countDocuments({category})
            );
            const categoriesCount=await Promise.all(categoriesCountPromise);

            const categoryCount: Record<string,number>[] =[];

            categories.forEach((category, i)=>{
                categoryCount.push({
                    [category]:Math.round((categoriesCount[i]/productCount)*100)
                })
            })


            const ratio={
                male:userCount-femaleUserCount,
                female:femaleUserCount,
            }

            const modifiedLatestTransactions=latestTransactions.map((transaction)=>{
                return {
                    _id:transaction._id,
                    discount:transaction.discount,
                    amount:transaction.total,
                    quantity:transaction.orderItems.length,
                    status:transaction.status,
                }
            })

            stats={
                ChangePercentage,
                count,
                chart:{
                    order:orderMonthCounts,
                    revenue:orderMonthyRevenue,
                },
                categoryCount,
                ratio,
                latestTransactions:modifiedLatestTransactions
            };

            myCache.set("admin-stats", JSON.stringify(stats));

        }

        res.status(200).json({
            sucesss: true,
            stats,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}