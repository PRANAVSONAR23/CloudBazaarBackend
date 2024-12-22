import { Coupon } from "../models/coupon.model.js";
import errorHandler from "../utils/utility-classes.js";
export const createCoupon = async (req, res, next) => {
    try {
        const { coupon, amount } = req.body;
        if (!coupon || !amount) {
            res.status(400).json({ success: false, message: "Please enter all fields" });
            return;
        }
        await Coupon.create({ code: coupon, amount });
        res.status(201).json({ success: true, message: `Coupon ${coupon} Created Successfully` });
    }
    catch (error) {
        next(error);
    }
};
export const applyDiscount = async (req, res, next) => {
    try {
        const { coupon } = req.query;
        const discount = await Coupon.findOne({ code: coupon });
        if (!discount) {
            res.status(400).json({ success: false, message: "Invalid Coupon Code" });
            return;
        }
        res.status(200).json({ success: true, discount: discount.amount });
    }
    catch (error) {
        next(new errorHandler("error", 500));
    }
};
export const allCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find({});
        res.status(200).json({ success: true, coupons });
    }
    catch (error) {
        next(new errorHandler("error", 500));
    }
};
export const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            res.status(400).json({ success: false, message: "Invalid Coupon Id" });
            return;
        }
        res.status(200).json({ success: true, message: "Coupon Deleted Successfully" });
    }
    catch (error) {
        next(new errorHandler("error", 500));
    }
};
