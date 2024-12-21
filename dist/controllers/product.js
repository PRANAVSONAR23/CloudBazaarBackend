import { Product } from "../models/product.model.js";
import { rm } from "fs";
export const newProduct = async (req, res, next) => {
    try {
        const { name, price, stock, category } = req.body;
        // Add validation checks
        if (!name || !price || !stock || !category) {
            res.status(400).json({
                message: "All fields (name, price, stock, category) are required",
                status: false
            });
            return;
        }
        const photo = req.file;
        // Check if photo is uploaded (if it's required)
        if (!photo) {
            res.status(400).json({
                message: "Product photo is required",
                status: false
            });
            return;
        }
        const product = await Product.create({
            name,
            price,
            stock,
            category: category.toLowerCase(),
            photo: photo.path
        });
        res.status(201).json({
            message: "Product created successfully",
            status: true
        });
    }
    catch (error) {
        // Log the actual error
        console.error('Error creating product:', error);
        // Send more specific error message
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
        return;
    }
};
export const getLatestProducts = async (req, res, next) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        res.status(200).json({
            message: "Latest products fetched successfully",
            status: true,
            products
        });
    }
    catch (error) {
        console.error('Error fetching latest products:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};
export const getAllCategories = async (req, res, next) => {
    try {
        const categories = await Product.distinct("category");
        res.status(200).json({
            message: "Categories fetched successfully",
            status: true,
            categories
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};
export const getAdminProducts = async (req, res, next) => {
    try {
        const products = await Product.find({});
        res.status(200).json({
            message: "Admin products fetched successfully",
            status: true,
            products
        });
    }
    catch (error) {
        console.error('Error fetching admin products:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};
export const getSingleProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({
                message: "Product not found",
                status: false
            });
            return;
        }
        res.status(200).json({
            message: "Product fetched successfully",
            status: true,
            product
        });
    }
    catch (error) {
        console.error('Error fetching single product:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};
export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, stock, category } = req.body;
        const photo = req.file;
        // Find the product by ID
        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({
                message: "Product not found",
                status: false,
            });
            return;
        }
        // Handle photo update
        if (photo) {
            if (product.photo) {
                // Remove old photo
                rm(product.photo, (err) => {
                    if (err) {
                        console.error("Error deleting old photo:", err);
                    }
                    else {
                        console.log("Old photo deleted");
                    }
                });
            }
            product.photo = photo.path;
        }
        // Update other fields
        if (name)
            product.name = name;
        if (price)
            product.price = parseFloat(price); // Ensure price is a valid number
        if (stock)
            product.stock = parseInt(stock, 10); // Ensure stock is a valid number
        if (category)
            product.category = category.toLowerCase();
        // Save the updated product
        await product.save();
        res.status(200).json({
            message: "Product updated successfully",
            status: true,
        });
        return;
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false,
        });
        return;
    }
};
export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find the product by ID
        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({
                message: "Product not found",
                status: false,
            });
            return;
        }
        // Remove the product photo if it exists
        if (product.photo) {
            rm(product.photo, (err) => {
                if (err) {
                    console.error("Error deleting product photo:", err);
                }
                else {
                    console.log("Product photo deleted");
                }
            });
        }
        // Delete the product
        await product.deleteOne();
        res.status(200).json({
            message: "Product deleted successfully",
            status: true,
        });
        return;
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false,
        });
        return;
    }
};
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, price, category, sort } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(process.env.PRODUCT_PER_PAGE) || 6;
        const skip = (page - 1) * limit;
        // Initialize baseQuery as a flexible object
        const baseQuery = {};
        if (search) {
            baseQuery.name = { $regex: String(search), $options: "i" }; // Ensure search is cast to a string
        }
        if (price) {
            baseQuery.price = { $lte: Number(price) };
        }
        if (category) {
            baseQuery.category = String(category); // Ensure category is cast to a string
        }
        const productsPromise = Product.find(baseQuery)
            .sort(sort ? { price: sort === 'asc' ? 1 : -1 } : undefined)
            .limit(limit)
            .skip(skip);
        const [products, totalProducts] = await Promise.all([
            productsPromise,
            Product.countDocuments(baseQuery)
        ]);
        const totalPages = Math.ceil(totalProducts / limit);
        res.status(200).json({
            message: "All products fetched successfully",
            status: true,
            products,
            totalPages,
        });
    }
    catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};
