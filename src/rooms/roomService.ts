import { Request, Response } from "express";
import { AddRoomSchema, EditRoomSchema } from "./schema.js";
import { Room } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { NotFoundException } from "../middleware/exceptions.js";
import { EditHomeSchema } from "../homes/schema.js";

export const addRoom=async(req:Request<{},{},AddRoomSchema>,res:Response)=>{
    const roomData:any={}
    if(req.body.floorLevel){
    roomData.floorLevel=req.body.floorLevel
    }
    if(req.body.roomSize){
    roomData.roomSize=req.body.roomSize
    }
    roomData.name=req.body.name
    
    const home=await prisma.home.findUnique({where:{
        id:req.body.homeId,
        userId:req.user?.userId
    }})
    
    if(home===null){
        throw new NotFoundException(`home with id ${req.body.homeId} and userId ${req.user?.userId} was not found`)
    }
    roomData.homeId=req.body.homeId

    const room =await prisma.room.create({data:roomData})

    return res.json(room)


}


export const editRoom=async(req:Request<{},{},EditRoomSchema>,res:Response)=>{
    const reqBody=req.body
    const roomData:Partial<Room>={}

    if(reqBody.floorLevel){
        roomData.floorLevel=reqBody.floorLevel
    }

    if(reqBody.name){
        roomData.name=reqBody.name
    }

    if(reqBody.roomSize){
        roomData.roomSize=reqBody.roomSize
    }

    const room=await prisma.room.update({where:{
        id:reqBody.roomId,
        home:{
            userId:req.user?.userId
        }
    },data:roomData})

    return res.json(room)
}

export const findRoomsByHomeId=async(req:Request,res:Response)=>{
    const homeId=parseInt(req.params.homeId as string)
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10
    const orderBy=(req.query.orderBy as "asc"||"desc")||"desc"

    const rooms=await prisma.room.findMany({where:{
        id:homeId,
        home:{
            userId:req.user?.userId

        }
    },orderBy:{
        createdAt:orderBy
    },skip:pageNumber*pageSize,take:pageSize})

    return res.json(rooms)
}