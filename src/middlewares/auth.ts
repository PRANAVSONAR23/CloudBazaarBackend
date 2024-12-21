import { NextFunction, Request, Response } from "express";
import errorHandler from "../utils/utility-classes.js";
import { User } from "../models/user.model.js";

export const adminOnly = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        if (!id) {
            next(new errorHandler("login first", 401));
            return;
        }
        const user= await User.findById(id);
        if(!user){
            next(new errorHandler("User not found", 404));
            return;
        }
        if(user.role !== "admin"){
            next(new errorHandler("Access denied. Admin privileges required.", 403));
            return;
        }
        next();

    } catch (error) {
        next(new errorHandler("error in admin middleware", 400));
    }
}