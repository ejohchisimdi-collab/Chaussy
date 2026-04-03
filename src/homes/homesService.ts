import { Request, Response } from "express";
import { AddHomeSchema, EditHomeSchema } from "./schema.js";
import { prisma } from "../prisma/client.js";
import { Home, PropertyType } from "@prisma/client";
import { ConflictException, NotFoundException } from "../middleware/exceptions.js";
import { deleteFromS3, generatePresignedUrl, uploadToS3 } from "../middleware/s3Service.js";
import { log } from "console";
export const addHome=async(req:Request<{},{},AddHomeSchema>,res:Response):Promise<Response<Home>>=>{
   console.info(`Adding home for user with id ${req.user?.userId} at ${new Date()} `)
    const userHome=await prisma.user.findUnique({where:{id:req.user?.userId},include:{
    homes:true
   }})
   if(userHome!.homes.length>=1 && userHome?.isPremium===false){
    throw new ConflictException(`User with id ${req.user?.userId} is only permitted to have one home. To get more homes upgrade to premium. Feature coming soon`)
    
   }
   
   
    const data: any = {
  propertyType: req.body.propertyType,
};


  data.userId = req.user!.userId;


if (req.body.yearBuilt !== undefined) {
  data.yearBuilt = req.body.yearBuilt;
}

if (req.body.address !== undefined) {
  data.address = req.body.address;
}

const home=await prisma.home.create({ data });
console.info("Home added successfully")
return res.json(home)

}


export const editHome=async(req:Request<{},{},EditHomeSchema>,res:Response)=>{
    console.log(`Editing home with id ${req.body.homeId} for user with id ${req.user?.userId}`)
    const homeData:Partial<Home>={}

    const reqBody=req.body!

    if(reqBody.address){
        homeData.address=reqBody.address
    }
    if(reqBody.propertyType){
        homeData.propertyType=reqBody.propertyType
    }
    if(reqBody.yearBuilt){
        homeData.yearBuilt=reqBody.yearBuilt

    }
    const home=await prisma.home.update({where:{
        id:reqBody.homeId,userId:req.user?.userId
    },data:homeData})

    console.log("Home edited successfully")
    return res.json(home)

}

export const addHomeProfilePicture=async(req:Request,res:Response)=>{

    const homeId=parseInt(req.params.id)
     console.log(`Adding profile picture for home with id ${homeId} at ${new Date()}`)
    const home=await prisma.home.findUnique({where:{
        id:homeId,userId:req.user?.userId

    }})
    if(home===null){
        throw new NotFoundException(`home with id ${homeId} and userId ${req.user?.userId} not found`)
    }
    return await prisma.$transaction(async(tx)=>{
        const profileKey= await uploadToS3(req.file!)
        const home=await tx.home.update({where:{
            userId:req.user?.userId,id:homeId
        },data:{
            profileKey:profileKey
        }})
        console.info("Picture added successfully")
        return res.json(home)
    })
    
}



export const deleteHomeProfilePicture=async(req:Request,res:Response)=>{
    const homeId=parseInt(req.params.id)
    console.log(`Deleting home profile picture for user with id ${req.user?.userId} for home with id ${homeId} at ${new Date()}`)
    const home=await prisma.home.findUnique({where:{
        id:homeId,userId:req.user?.userId

    }})
    if(home===null){
        throw new NotFoundException(`home with id ${homeId} and userId ${req.user?.userId} not found`)
    }
    if(home.profileKey===null){
        throw new ConflictException(`Profile key for home with id ${homeId} does not exist`)
    }
    return await prisma.$transaction(async(tx)=>{
        await deleteFromS3(home.profileKey!)
        await tx.home.update({where:{
            id:homeId,
            userId:req.user?.userId
        },data:{
            profileKey:null
        }})

    
        console.info(`Profile picture deleted successfully`)
        return res.json("Home picture deleted")


    })
}
export const viewHomeProfilePicture=async(req:Request,res:Response)=>{
    const homeId=parseInt(req.params.id)
    console.info(`Retrieving home profile picture for user with id ${req.user?.userId} for home with id ${homeId} at ${new Date()}`)
    const home=await prisma.home.findUnique({where:{
        id:homeId,userId:req.user?.userId

    }})
    if(home===null){
        throw new NotFoundException(`home with id ${homeId} and userId ${req.user?.userId} not found`)
    }
    if(home.profileKey===null){
        throw new ConflictException(`Profile key for home with id ${homeId} does not exist`)
    }

    return res.json(await generatePresignedUrl(home.profileKey))
}

export const viewHomeByUser=async(req:Request,res:Response)=>{
    console.info(`Retrieving homes for user with id ${req.user?.userId}`)
    const orderBy =
  req.query.orderBy === "asc" || req.query.orderBy === "desc"
    ? req.query.orderBy
    : "desc";
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10
    const home=await prisma.home.findMany({where:{
        userId:req.user?.userId
    },orderBy:{
        createdAt:orderBy
},skip:pageNumber*pageSize,take:pageSize})
    return res.json(home)
}