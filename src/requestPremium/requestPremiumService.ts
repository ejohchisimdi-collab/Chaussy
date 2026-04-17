import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { ConflictException } from "../middleware/exceptions.js";

export const requestPremium=async(req:Request,res:Response)=>{
    console.info(`Requesting premium for user with id ${req.user?.userId}`)
    const userId=req.user!.userId

    const user=await prisma.user.findUnique({where:{
        
        id:req.user?.userId
    }})

    if(user?.isEmailConfirmed===false){
        throw new ConflictException("Email not confirmed")
    }
    



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

