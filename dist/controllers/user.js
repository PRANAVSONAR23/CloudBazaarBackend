import { User } from "../models/user.model.js";
import errorHandler from "../utils/utility-classes.js";
export const newUser = async (req, res, next) => {
    try {
        const { name, email, photo, gender, dob, _id } = req.body;
        let user = await User.findById(_id);
        if (user) {
            res.status(200).json({
                success: true,
                message: `Welcome ${user.name}`,
            });
            return;
        }
        if (!name || !email || !photo || !gender || !dob || !_id) {
            next(new errorHandler("Please fill all the fields", 400));
            return;
        }
        user = await User.create({
            name, email, photo, gender, dob: new Date(dob), _id
        });
        res.status(200).json({
            success: true,
            message: `Welcome ${name}`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: "error in creating new user"
        });
    }
};
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {
        next(new errorHandler("error in fetching all users", 400));
    }
};
export const getUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            next(new errorHandler("Invalid Id", 400));
            return;
        }
        res.status(200).json({
            success: true,
            user
        });
    }
    catch (error) {
        next(new errorHandler("error in fetching user", 400));
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            next(new errorHandler("Invalid Id", 400));
            return;
        }
        await User.deleteOne();
        res.status(200).json({
            success: true,
            message: "user deleted successfully"
        });
    }
    catch (error) {
        next(new errorHandler("error in fetching user", 400));
    }
};
