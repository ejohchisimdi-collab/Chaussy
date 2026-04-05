import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";

export const requestPremium=async(req:Request,res:Response)=>{
    const userId=req.user!.userId

    const hasRequest=await prisma.requestPremium.findUnique({where:{
        userId:userId
    }})

    if(hasRequest===null){
        await prisma.requestPremium.create({data:{
            userId:userId,
            timesRequested:1
        
        }})
        return res.json("Thank you for Requesting premium however this feature is not available at the moment. However when it is added you will be notified via email")
    }
    else{
        await prisma.requestPremium.update({where:{
            userId:userId
        },data:{
            timesRequested:{increment:1}
        }})
        return res.json("Thank you for Requesting premium however this feature is not available at the moment. However when it is added you will be notified via email")
    }

}

