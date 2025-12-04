import client from "./client"

export const login=async(className,password)=>{
    const res=await client.post("/auth/login",{className,password})
    return res.data
}

export const registerStudio=async(className,email,password)=>{
    const res=await client.post("/auth/register",{className,email,password})
    return res.data;
}