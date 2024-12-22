import express from 'express';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
//importing routes
import userRoutes from './routes/user.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
config({
    path: "./.env"
});
const mongoURI = process.env.MONGO_URI || "";
connectDB(mongoURI);
const app = express();
const PORT = process.env.PORT || 4000;
export const myCache = new NodeCache();
//middlewares
app.use(express.json());
app.use(morgan("dev"));
//using routes 
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(PORT, () => {
    console.log(`express is running on port ${PORT}`);
});
