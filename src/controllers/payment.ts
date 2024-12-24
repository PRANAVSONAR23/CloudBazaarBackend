import { NextFunction, Request, Response } from "express";
import { Coupon } from "../models/coupon.model.js";
import errorHandler from "../utils/utility-classes.js";
import { stripe } from "../app.js";


export const createPaymentIntent=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {amount}=req.body;
        if(!amount){
            res.status(400).json({success:false,message:"Please enter amount"})
            return;
        }
        const paymentIntent=await stripe.paymentIntents.create({
            amount:Number(amount)*100,
            currency:"inr"
        })
        res.status(201).json({success:true,clientSecret:paymentIntent.client_secret})
    } catch (error) {
        next(new errorHandler("error",500))
    }
}


export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { coupon, amount } = req.body;
        if (!coupon || !amount) {
            res.status(400).json({ success: false, message: "Please enter all fields" });
            return;
        }
        await Coupon.create({ code: coupon, amount });
        res.status(201).json({ success: true, message: `Coupon ${coupon} Created Successfully` });
    } catch (error) {
        next(error);
    }
}   


export const applyDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { coupon } = req.query;
        const discount = await Coupon.findOne({ code: coupon });
        if (!discount) {
            res.status(400).json({ success: false, message: "Invalid Coupon Code" });
            return;
        }
        res.status(200).json({ success: true, discount: discount.amount });
    } catch (error) {
        next(new errorHandler("error", 500));
    }
}

export const allCoupons = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const coupons = await Coupon.find({});
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        next(new errorHandler("error", 500));
    }
}

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            res.status(400).json({ success: false, message: "Invalid Coupon Id" });
            return;
        }
        res.status(200).json({ success: true, message: "Coupon Deleted Successfully" });
    } catch (error) {
        next(new errorHandler("error", 500));
    }
}