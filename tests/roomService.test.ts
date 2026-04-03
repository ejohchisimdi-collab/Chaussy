import { DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { expect, it, vi } from "vitest";
import { prisma } from "../src/prisma/client";
import { PrismaClient } from "@prisma/client";
import { before, beforeEach, describe } from "node:test";
import { Request, Response } from "express";
import {AddRoomSchema} from "../src/rooms/schema"
import { request } from "http";
import {addRoom}from "../src/rooms/roomService"
import { NotFoundException } from "../src/middleware/exceptions.ts";

vi.mock("../src/prisma/client.ts",()=>({

    prisma:mockDeep<PrismaClient>()

}))

const prismaMock=prisma as unknown as DeepMockProxy<PrismaClient>

describe("Add Room",()=>{
    beforeEach(()=>{
        vi.clearAllMocks()
    })

    let req:Partial<Request<{},{},AddRoomSchema>>={
        user:{
            userId:1,
            email:"ejohc"
        },
        body:{
            homeId:1,
            name:"kitchen"
        }
        
    }

    let res:Partial<Response>={
        json:vi.fn()
    }
    
    it("should add a room successfully",async()=>{
        (prismaMock.home.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({});
        (prismaMock.room.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

        await addRoom(req as Request,res as Response)

        expect(prisma.home.findUnique).toHaveBeenCalled();
        expect(prisma.room.create).toHaveBeenCalled()
    })
    it("should throw for missing home",async()=>{
        (prismaMock.home.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (prismaMock.room.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

        await expect(addRoom(req as Request,res as Response)).rejects.toThrow(NotFoundException)

    })

})
