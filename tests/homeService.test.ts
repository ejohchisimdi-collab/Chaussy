import { DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { expect, it, vi, vitest } from "vitest";
import { prisma } from "../src/prisma/client";
import { beforeEach, describe } from "vitest";

import { PrismaClient, PropertyType } from "@prisma/client";
import { Request, Response } from "express";
import{AddHomeSchema} from "../src/homes/schema"
import { partial } from "zod/v4-mini";
import {addHome} from "../src/homes/homesService";
import { ConflictException } from "../src/middleware/exceptions.ts";


vitest.mock("../src/prisma/client.ts",()=>({
    prisma:mockDeep<PrismaClient>()


}))

const prismaMock=prisma as unknown as DeepMockProxy<PrismaClient>



describe("Add home",()=>{
    beforeEach(()=>{
        vi.clearAllMocks()
    })
    let req:Partial<Request<{},{},AddHomeSchema>>={
        user:{
            userId:1,
            email:"ejoh c"
        },
        body:{
            address:"200",
            propertyType:PropertyType.APARTMENT,
            yearBuilt:2000
        }
    };
        
    let res:Partial<Response>={
        json:vi.fn()
    }
    
    it("should add a home successfully",async()=>{
        (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({homes:[]});
    
        (prismaMock.home.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

        await addHome(req as Request,res as  Response )

        expect(prisma.home.create).toHaveBeenCalled()
    })
    it("should Throw from no premium and more than one house a ",async()=>{
        (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({isPremium:false,homes:[{},{}]});
    
        (prismaMock.home.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

        await expect(addHome(req as Request,res as  Response )).rejects.toThrow(ConflictException)

        
    })

})