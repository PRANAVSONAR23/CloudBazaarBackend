import { Request, Response, NextFunction } from 'express';
import errorHandler from '../utils/utility-classes.js';

export const errorMiddleware = (err:errorHandler,req:Request,res:Response,next:NextFunction)=>{

    err.message=err.message || "Internal Server Error"
    err.statusCode=err.statusCode || 500

    res.status(err.statusCode).json({
        success:false,
        message:err.message
    })
}