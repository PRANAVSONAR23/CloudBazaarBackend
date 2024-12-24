import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, orderItemType } from "../types/type.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";

export const connectDB = (uri: string) => {
  mongoose.connect(uri, {
    dbName: "Cloudbazaar",
  })
    .then((c) => console.log(`DB connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};


export const invalidateCache = async ({ product, order, admin, userId, orderId }: InvalidateCacheProps) => {
  if (product) {

    const productKeys: string[] = ["latestProducts", "adminProducts", "categories"];
    const products = await Product.find({}).select("_id")

    products.forEach(i => {
      productKeys.push(`product-${i._id}`)
    })

    myCache.del(productKeys)
  }
  if (order) {
    const orderKeys: string[] = ["allOrders", `myOrders-${userId}`, `order-${orderId}`];

    myCache.del(orderKeys)
  }
  if (admin) {
    myCache.del(["admin-stats","admin-pie-chart","admin-bar-chart","admin-line-chart"])
  }
};


export const reduceStock = async (orderItems: orderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};


export const calculatePercentage = (currentMonth: number, lastMonth: number) => {
  if (lastMonth === 0) {
    return currentMonth * 100;
  }
  return Math.round(((currentMonth) / lastMonth) * 100);
}


export const getInventories = async ({ categories, productCount }: { categories: string[], productCount: number }) => {
  const categoriesCountPromise = categories.map((category) => Product.countDocuments({ category }));
  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];
  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productCount) * 100)
    })
  })

  return categoryCount;
}

interface MyDocument extends Document {
  createdAt: Date,
  discount?:number,
  total?:number
}

type FuncProp = {
  length: number,
  docArr: MyDocument[],
  today:Date
  property?: "discount" | "total",

}

export const getChartData = ({ length, docArr ,today,property}: FuncProp) => {
  
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationdDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationdDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      data[length - monthDiff - 1]+=property?i.discount!:1;
    }

  });
  return data;
}


