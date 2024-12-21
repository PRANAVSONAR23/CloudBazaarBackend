import {Schema,model} from "mongoose"
import validator from 'validator'


interface IUser {
    _id:string,
    name:string,
    email:string,
    password:string,
    role:string,
    gender:string,
    photo:string,
    dob:Date,
    createdAt:Date,
    updatedAt:Date,
    age:number
}


const userSchema = new Schema({
    _id:{
        type:String,
        required:[true,"Please enter Id"]
    },
    name:{
        type:String,
        required:[true,"Please enter Name"]
    },
    email:{
        type:String,
        unique:[true,"Email already Exist"],
        required:[true,"Please enter Email"],
        validate:[validator.default.isEmail,"Please enter a valid email"]
    },
    password:{
        type:String,
        required:false
    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user"
    },
    gender:{
        type:String,
        enum:["male","female"],
        required:[true,"please enter gender"]
    },
    photo:{
        type:String,
        required:[true,"please add photo"]
    },
    dob:{
        type:Date,
        required:[true,"please enter date of birth"]
    }

},{timestamps:true}) 

userSchema.virtual("age").get(function(){
    const today=new Date()
    const dob=this.dob
    let age=today.getFullYear()-dob.getFullYear()
    if(today.getMonth()<dob.getMonth() || (today.getMonth()===dob.getMonth() && today.getDate()<dob.getDate())){
        age--
    }
    return age
})

export const User = model<IUser>("User",userSchema)

