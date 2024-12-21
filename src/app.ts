import express from 'express'

//importing routes
import userRoutes from './routes/user.js'
import productRoutes from './routes/products.js'

import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';


connectDB()

const app=express()

const PORT=4000;

//middlewares
app.use(express.json())

//using routes 
app.use("/api/v1/user",userRoutes)
app.use("/api/v1/product", productRoutes)


app.use("/uploads", express.static("uploads"))

app.use(errorMiddleware)

app.listen(PORT,()=>{
    console.log(`express is running on port ${PORT}`)
})

