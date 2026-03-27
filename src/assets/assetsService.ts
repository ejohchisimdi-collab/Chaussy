import { Request, Response } from "express";
import { CreateHomeAssetSchema, CreateRoomAssetsSchema, EditAssetSChema } from "./schema.js";
import { Assets, HomeAssets } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { NotFoundException } from "../middleware/exceptions.js";
import { request } from "http";
import { log } from "console";

export const createHomeAsset=async(req:Request<{},{},CreateHomeAssetSchema>,res:Response)=>{
    console.info(`Creating home asset for user with id ${req.user?.userId}`)
    const body=req.body
    const homes =await prisma.home.findUnique({where:{
        id:body.homeId,userId:req.user?.userId
    }})

    if(homes===null){
        throw new NotFoundException(`Home with id ${body.homeId} and userId ${req.user?.userId} not found`)
    }
    const homeAssets=await prisma.assets.create({data:{
        name:body.name,
        brandName:body.brandName,
        purchaseDate:body.purchaseDate,
        notes:body.notes,
        modelName:body.modelName,
        userId:req.user!.userId,

        homeAssets:{
            create:{
                homeId:body.homeId
            }
        }
    }
    
                   
    })
    console.info("Asset created successfully")
    return res.json(homeAssets)
}

    


    
export const createRoomAsset=async(req:Request<{},{},CreateRoomAssetsSchema>,res:Response)=>{
    console.info(`Creating room asset for user with id ${req.user?.userId}`)
    const body=req.body

    const room =await prisma.room.findUnique({where:{
        id:body.roomId,home:{
            userId:req.user?.userId
        }
    }})

    if(room===null){
        throw new NotFoundException(`Room with id ${req.body.roomId} and userId ${req.user?.userId} not found`)
    }
    const roomAssets=await prisma.assets.create({data:{
        name:body.name,
        brandName:body.brandName,
        purchaseDate:body.purchaseDate,
        notes:body.notes,
        modelName:body.modelName,
        userId:req.user!.userId,

        roomAssets:{
            create:{
                roomId:body.roomId
            }
        }
    }});
    console.info("Asset created successfully")
    
    return res.json(roomAssets)
}

export const editAsset=async(req:Request<{},{},EditAssetSChema>,res:Response)=>{
    console.info(`Editing asset with id ${req.body.assetId} for user with id ${req.user?.userId} `)
    const body=req.body
    const asset=await prisma.assets.findUnique({where:{
        id:body.assetId,userId:req.user?.userId
    }})

    if(asset===null){
        throw new NotFoundException(`Asset with Id ${body.assetId} and userId ${req.user?.userId} not found`)
    }

const assetData:Partial<Assets>={}
    if(body.brandName){

        assetData.brandName=body.brandName
    }
    if(body.modelName){
        assetData.modelName=body.modelName

    }
    if(body.name){
        assetData.name=body.name

    }
    if(body.notes){
        assetData.notes=body.notes

    }
    if(body.purchaseDate){
        assetData.purchaseDate=body.purchaseDate

    }

    const updatedAsset=await prisma.assets.update({where:{
        id:body.assetId
    },data:assetData})
    console.info("Asset edited successfully")

    return res.json(updatedAsset)
}

export const findAssetsByHomeAndUserId=async(req:Request,res:Response)=>{
    
    const homeId=parseInt(req.params.homeId)
    console.info(`Retrieving asset by homeId ${homeId} and userId ${req.user?.userId}`)
    const orderBy = req.query.orderBy === "asc" || req.query.orderBy === "desc"
    ? req.query.orderBy
    : "desc";
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10

    const assets=await prisma.homeAssets.findMany({where:{
        homeId:homeId,assets:{

            userId:req.user?.userId
        }
        
        
    },include:{
        assets:true
    },orderBy:{
        createdAt:orderBy

    },skip:pageNumber*pageSize,take: pageSize})

    return res.json(assets.map(assets=>assets.assets))
}


export const findAssetsByRoomAndUserId=async(req:Request,res:Response)=>{

    
    const roomId=parseInt(req.params.roomId)
    console.info(`Retrieving asset by roomId ${roomId} and userId ${req.user?.userId}`)
   
    const orderBy = req.query.orderBy === "asc" || req.query.orderBy === "desc"
    ? req.query.orderBy
    : "desc";
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10

    const assets =await prisma.roomAssets.findMany({
        where:{
            roomId:roomId,assets:{
                userId:req.user?.userId
            }
        },include:{
            assets:true
        },orderBy:{
            createdAt:orderBy
        },
        skip:pageNumber*pageSize,take:pageSize
    })

    return res.json(assets.map(assets=>assets.assets))

}



