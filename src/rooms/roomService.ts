import { Request, Response } from "express";
import { AddRoomSchema, EditRoomSchema } from "./schema.js";
import { Room } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { NotFoundException } from "../middleware/exceptions.js";
import { EditHomeSchema } from "../homes/schema.js";

export const addRoom=async(req:Request<{},{},AddRoomSchema>,res:Response)=>{
    console.info(`Adding room for home with id ${req.body.homeId} for user with id ${req.user?.userId}`)
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

    console.info(`Room added successfully`)
    return res.json(room)


}


export const editRoom=async(req:Request<{},{},EditRoomSchema>,res:Response)=>{
    console.info(`Editing room for user with id ${req.user?.userId} for room with id${req.body.roomId}`)
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
    console.info("Room edited successfully")
    return res.json(room)
}

export const findRoomsByHomeId=async(req:Request,res:Response)=>{
    console.log(`Retrieving rooms for user with id ${req.user?.userId} for home with id ${req.params.homeId} `)
    const homeId=parseInt(req.params.homeId as string)
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10
    const orderBy =
  req.query.orderBy === "asc" || req.query.orderBy === "desc"
    ? req.query.orderBy
    : "desc";

    const rooms=await prisma.room.findMany({where:{
        homeId:homeId,
        home:{
            userId:req.user?.userId

        }
    },orderBy:{
        createdAt:orderBy
    },skip:pageNumber*pageSize,take:pageSize})

    return res.json(rooms)
}