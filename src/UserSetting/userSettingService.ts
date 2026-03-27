import { Request, Response } from "express";
import { EditUserSettingSchema } from "./schema.js";
import { prisma } from "../prisma/client.js";
import { UserSetting } from "@prisma/client";
import { ConflictException } from "../middleware/exceptions.js";

export const editUserSetting=async(req:Request<{},{},EditUserSettingSchema>,res:Response)=>{
    const user=await prisma.user.findUnique({where:{id:req.user?.userId}})

    const userSettingData:Partial<UserSetting>={}
    const body=req.body

    if(body.enableEmailNotifications){
        if(body.enableEmailNotifications===true&&user?.isEmailConfirmed===false){
            throw new ConflictException("Email needs to be verified for this feature")
        }
        else{
            userSettingData.enableEmailNotifications=body.enableEmailNotifications
        }
    }
    const userSetting=await prisma.userSetting.update({where:{
        userId:req.user?.userId

    },data:userSettingData})

    return res.json(userSetting)
}

export const findUserSettingByUserId=async(req:Request,res:Response)=>{
    return res.json(await prisma.userSetting.findUnique({where:{
        userId:req.user?.userId
    }}))
}