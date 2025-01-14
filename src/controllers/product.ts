import { NextFunction, Request, Response } from "express";
import { Product } from "../models/product.model.js";
import { BaseQuery, NewProductResponseBody } from "../types/type.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { deleteFromCloudinary, invalidateCache, uploadToCloudinary } from "../utils/features.js";

export const newProduct = async (req: Request<{}, {}, NewProductResponseBody>, res: Response, next: NextFunction) => {
    try {
      
        const { name, price, stock, category } = req.body;

        // Add validation checks
        if (!name || !price || !stock || !category) {
             res.status(400).json({
                message: "All fields (name, price, stock, category) are required",
                status: false
            });
            return ;
        }

        const photos = req.files as Express.Multer.File[] | undefined;
        // Check if photo is uploaded (if it's required)
        if (!photos) {
            res.status(400).json({
                message: "Product photos is required",
                status: false
            });
            return;
        }
        if(photos.length<1){
            res.status(400).json({
                message: "Product photos is required",
                status: false
            });
            return;
        }

        if(photos.length>5){
            res.status(400).json({
                message: "Maximum 5 photos",
                status: false
            });
            return;
        }

        const photosURl=await uploadToCloudinary(photos)

        const product = await Product.create({
            name,
            price,
            stock,
            category: category.toLowerCase(),
            photos: photosURl
        });

        // Invalidate cache for "latestProducts" and "adminProducts"
        await invalidateCache({ product: true ,admin:true});

        res.status(201).json({
            message: "Product created successfully",
            status: true,
            product
        });
       

    } catch (error) {
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


export const getLatestProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let products=[];

        if(myCache.has("latestProducts")){
            products=JSON.parse(myCache.get("latestProducts") as string);
        }
        else{
            products = await Product.find({}).sort({ createdAt: -1 }).limit(4);
            myCache.set("latestProducts",JSON.stringify(products));
        
        }

        res.status(200).json({
            message: "Latest products fetched successfully",
            status: true,
            products
        });
    } catch (error) {
        console.error('Error fetching latest products:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};


export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
 
        let categories;

        if(myCache.has("categories")){
            categories=JSON.parse(myCache.get("categories") as string);
        }
        else{
            categories = await Product.distinct("category");
            myCache.set("categories", JSON.stringify(categories));
        }

        

        res.status(200).json({
            message: "Categories fetched successfully",
            status: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};



export const getAdminProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {

        let products;

        if(myCache.has("adminProducts")){
            products=JSON.parse(myCache.get("adminProducts") as string);
        }
        else{
            products = await Product.find({});
            myCache.set("adminProducts", JSON.stringify(products));
        }


        res.status(200).json({
            message: "Admin products fetched successfully",
            status: true,
            products
        });
    } catch (error) {
        console.error('Error fetching admin products:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};



export const getSingleProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        let product;

        if(myCache.has(`product-${id}`)){
            product=JSON.parse(myCache.get(`product-${id}`) as string);
        }
        else{
            product = await Product.findById(id);
            if (!product) {
                res.status(404).json({
                    message: "Product not found",
                    status: false
                });
                return;
            }
            myCache.set(`product-${id}`, JSON.stringify(product));
        }


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
    } catch (error) {
        console.error('Error fetching single product:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};


export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, price, stock, category } = req.body;
        const photos = req.files as Express.Multer.File[] | undefined;

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
        if (photos) {
            const cloudinaryResults = await uploadToCloudinary(photos);
            
            // Delete old photos from Cloudinary
            const ids = product.photos.map((p) => p.public_id);
            await deleteFromCloudinary(ids);

            // Remove all existing photos using MongoDB $set operator
            await Product.findByIdAndUpdate(id, {
                $set: {
                    photos: cloudinaryResults.map(result => ({
                        public_id: result.public_id,
                        url: result.secure_url
                    }))
                }
            });

            // Refresh the product instance
            const updatedProduct = await Product.findById(id);
            if (!updatedProduct) {
                throw new Error("Product not found after update");
            }
            product.photos = updatedProduct.photos;
        }

        // Update other fields
        if (name) product.name = name;
        if (price) product.price = parseFloat(price); // Ensure price is a valid number
        if (stock) product.stock = parseInt(stock, 10); // Ensure stock is a valid number
        if (category) product.category = category.toLowerCase();

        // Save the updated product
        await product.save();

        await invalidateCache({ product: true,admin:true });

        res.status(200).json({
            message: "Product updated successfully",
            status: true,
        });
        return;
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false,
        });
        return;
    }
};


export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
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
        const ids=product.photos.map((photo)=>photo.public_id)

        await deleteFromCloudinary(ids);

        // Delete the product
        await product.deleteOne();

        await invalidateCache({ product: true ,admin:true});

        res.status(200).json({
            message: "Product deleted successfully",
            status: true,
        });
        return;
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false,
        });
        return;
    }
};



export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, price, category, sort } = req.query;
        const page = Number(req.query.page) || 1;

        const limit = Number(process.env.PRODUCT_PER_PAGE) || 6;
        const skip = (page - 1) * limit;

        // Initialize baseQuery as a flexible object
        const baseQuery: BaseQuery = {};

        if (search) {
            baseQuery.name = { $regex: String(search), $options: "i" }; // Ensure search is cast to a string
        }
        if (price) {
            baseQuery.price = { $lte: Number(price) };
        }
        if (category) {
            baseQuery.category = String(category); // Ensure category is cast to a string
        }

        const productsPromise =  Product.find(baseQuery)
            .sort(sort ?{price:sort==='asc'?1:-1}:undefined)
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
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            status: false
        });
    }
};