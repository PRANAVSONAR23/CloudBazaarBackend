import { NextFunction, Request, Response } from "express";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { calculatePercentage, getChartData } from "../utils/features.js";


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
                const monthDiff= (today.getMonth() - creationdDate.getMonth()+12)%12;

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


export const getPieChart=async (req:Request,res:Response,next:NextFunction)=>{
    try {
        let pieChart;

        if(myCache.has("admin-pie-chart")){
            pieChart=JSON.parse(myCache.get("admin-pie-chart") as string);
        }
        else{
            
            const allOrderPromise=Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"]);

            const [
                processingOrder,
                shippedOrder,
                deliveredOrder,
                categories,
                productCount,
                productOutofStock,
                allOrders,
                allUser,
                adminUser,
                coustomerUser
            ]=await Promise.all([
                Order.countDocuments({status:"Processing"}),
                Order.countDocuments({status:"Shipped"}),
                Order.countDocuments({status:"Delivered"}),
                Product.distinct('category'),
                Product.countDocuments(),
                Product.countDocuments({stock:0}),
                allOrderPromise,
                User.find({}).select(["dob"]),
                User.countDocuments({role:"admin"}),
                User.countDocuments({role:"user"})

            ])

            
            const orderFullfillment={
               processing: processingOrder,
               shipping: shippedOrder,
               delivered: deliveredOrder,
            }

            const categoriesCountPromise=categories.map((category)=>
                Product.countDocuments({category})
            );
            const categoriesCount=await Promise.all(categoriesCountPromise);

            const productCategories: Record<string,number>[] =[];

            categories.forEach((category, i)=>{
                productCategories.push({
                    [category]:Math.round((categoriesCount[i]/productCount)*100)
                })
            })

            const stockAvailability={
                inStock:productCount-productOutofStock,
                outOfStock:productOutofStock
            }

            const grossIncome=allOrders.reduce((total, order)=>total+(order.total || 0), 0);
            const discount=allOrders.reduce((total, order)=>total+(order.discount || 0), 0);
            const productionCost=allOrders.reduce((total, order)=>total+(order.shippingCharges || 0), 0);
            const burnt=allOrders.reduce((total, order)=>total+(order.tax || 0), 0);
            const marketingCost=Math.round(grossIncome*(30/100));
            const netMargin=grossIncome-discount-productionCost-burnt-marketingCost;

            const revenueDistribution={
                netMargin,
                discount,
                productionCost,
                burnt,
                marketingCost
            }

            const adminCustomer={
               admin:adminUser,
               customer:coustomerUser
            }

            const usersAgeGroup={
              teen:allUser.filter((i)=>i.age<20).length,
              adult:allUser.filter((i)=>i.age>=20 && i.age<40).length,
              old:allUser.filter((i)=>i.age>=40).length
            }
 
            pieChart={orderFullfillment,productCategories,stockAvailability,revenueDistribution,adminCustomer,usersAgeGroup}


            myCache.set("admin-pie-chart", JSON.stringify(pieChart));
        }

        res.status(200).json({
            sucesss: true,
            pieChart,
        });
    } catch (error:any) {
        res.status(500).json({ message: error.message });
    }
}


export const getBarChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let barChart;

        if (myCache.has("admin-bar-chart")) {
            barChart = JSON.parse(myCache.get("admin-bar-chart") as string);
        } else {
            const today = new Date();

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const sixMonthsProductPromise = Product.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today,
                },
            }).select("createdAt")

            const sixMonthsUserPromise = User.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today,
                },
            }).select("createdAt")

            const twelveMonthsOrderPromise = Order.find({
                createdAt: {
                    $gte: twelveMonthsAgo,
                    $lte: today,
                },
            }).select("createdAt")

            const [products, users, orders] = await Promise.all([
                sixMonthsProductPromise,
                sixMonthsUserPromise,
                twelveMonthsOrderPromise,
            ]);

           const productCount= getChartData({length:6,today,docArr:products})
           const userCount= getChartData({length:6, today, docArr:users}) 
           const orderCount= getChartData({length:12, today, docArr:orders})

           barChart = {product:productCount,user:userCount,order:orderCount};

            myCache.set("admin-bar-chart", JSON.stringify(barChart));
        }

        res.status(200).json({
            success: true,
            barChart,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


export const getLineChart=async (req:Request,res:Response,next:NextFunction)=>{
    try {
        let lineChart;

        if(myCache.has("admin-line-chart")){
            lineChart=JSON.parse(myCache.get("admin-line-chart") as string);
        }
        else{
            const today=new Date();

            const twelveMonthsAgo=new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12);

            const baseQuery={
                createdAt:{
                    $gte:twelveMonthsAgo,
                    $lte:today
                }
            }

            const [products, users, orders]=await Promise.all([
                Product.find(baseQuery).select("createdAt"),
                User.find(baseQuery).select("createdAt"),
                Order.find(baseQuery).select(["createdAt", "total","discount"])
            ])

            const productCount= getChartData({length:12, today, docArr:products})
            const userCount= getChartData({length:12, today, docArr:users})
            const discount= getChartData({length:12, today, docArr:orders, property:"discount"})
            const revenue= getChartData({length:12, today, docArr:orders, property:"total"})

            lineChart={product:productCount,user:userCount,discount,revenue}

            myCache.set("admin-line-chart", JSON.stringify(lineChart));
        }

        res.status(200).json({
            sucesss: true,
            lineChart,
        });
    } catch (error:any) {
        res.status(500).json({ message: error.message });
    }
}