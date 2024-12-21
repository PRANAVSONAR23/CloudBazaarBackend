export interface NewUserRequestBody{
    name:string,
    email:string,
    photo:string,
    gender:string,
    _id:string,
    dob:Date
}

export interface NewProductResponseBody{
  name:string,
  price:number,
  stock:number,
  category:string
}

// export type ControllerType = (
//     req: Request<{}, {}, NewProductResponseBody>,
//     res: Response,
//     next: NextFunction
// ) => Promise<void>;

export type SearchRequestQuery={
    search?:string,
    price?:string,
    category?:string,
    sort?:string,
    page?:string
}

export type BaseQuery = {
    name?: { $regex: string; $options: string };
    price?: { $lte: number };
    category?: string;
};


export type InvalidateCacheProps={
    product?:boolean,
    admin?:boolean,
    order?:boolean,
}

export type orderItemType={
    name:string,
    photo:string,
    price:number,
    quantity:number,
    productId:string
}

export type ShippingInfo={
    address:string,
    city:string,
    state:string,
    country:string,
    pinCode:number
}

export interface NewOrderRequestBody{
    shippingInfo:ShippingInfo,
    user:string,
    subtotal:number,
    tax:number,
    shippingCharges:number,
    discount:number,
    total:number,
    orderItems:orderItemType[]
}
