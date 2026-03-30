import { Request, Response } from "express";
import { AddWarrantySchema, EditWarrantySchema, WarrantyDocumentsSchema } from "./schema.js";
import { prisma } from "../prisma/client.js";
import { ConflictException, NotFoundException } from "../middleware/exceptions.js";
import { Assets, User, Warranties, WarrantyDocuments, WarrantyStatus } from "@prisma/client";
import { gte, promise, size } from "zod/v4";
import { deleteFromS3, generatePresignedUrl, uploadToS3 } from "../middleware/s3Service.js";
import { extractFieldsFromPdf } from "../middleware/gemniMiddleware.js";
import { v4 as uuidv4 } from "uuid"
import cron from "node-cron";
import { sendEmail } from "../middleware/sendgrid.js";
import { json, text } from "stream/consumers";

const toWarrantyDTO=(warranties:Warranties)=>{
    return{
        id:warranties.id,
        providerName:warranties.providerName,
        startDate:warranties.startDate,
        expiryDate:warranties.expiryDate,
        coverageNotes:warranties.coverageNotes,
        assetId:warranties.assetId,
        createdAt:warranties.createdAt,
        warrantyStatus:warranties.warrantyStatus

    }
}

export const addWarranty=async(req:Request<{},{},AddWarrantySchema>,res:Response)=>{
const body=req.body
console.info(`Adding warranty for user with id ${req.user?.userId} `)
    const asset=await prisma.assets.findUnique({where:{
        id:body.assetId,userId:req.user?.userId
    }})

    if(asset===null){
        throw new NotFoundException(`Asset with id ${body.assetId} and user Id ${req.user?.userId} not found`)
    }
   const now = new Date();
const expiry = new Date(body.expiryDate);

// 30 days before expiry
const expiringSoonThreshold = new Date(expiry);
expiringSoonThreshold.setDate(expiringSoonThreshold.getDate() - 30);

let warrantyStatus;

if (expiry < now) {
  warrantyStatus = WarrantyStatus.EXPIRED;
} else if (now >= expiringSoonThreshold) {
  warrantyStatus = WarrantyStatus.EXPIRING_SOON;
} else {
  warrantyStatus = WarrantyStatus.ACTIVE;
}
    const warranty=await prisma.warranties.create({data:{
        assetId:body.assetId,
        providerName:body.providerName,
        startDate:body.startDate,
        expiryDate:body.expiryDate,
        coverageNotes:body.coverageNotes,
        warrantyStatus:warrantyStatus
        

    }})
    console.info("Warranty added successfully")

    return res.json(toWarrantyDTO(warranty))

}

export const editWarranties=async(req:Request<{},{},EditWarrantySchema>,res:Response)=>{
    const body=req.body
    console.info(`Editing warranty with id ${body.warrantyId} for user with id ${req.user?.userId} `)
    const warranty=await prisma.warranties.findUnique({where:{
        id:body.warrantyId,asset:{
            userId:req.user?.userId
        }
    }})

    if(warranty===null){
        throw new NotFoundException(`Warranty with id ${body.warrantyId} and userId ${req.user?.userId} not found `)
    }

    const warrantyData:Partial<Warranties>={}
    if(body.coverageNotes){
        warrantyData.coverageNotes=body.coverageNotes
    }
    if(body.expiryDate){
        warrantyData.expiryDate=body.expiryDate
        const now = new Date();
const expiry = new Date(body.expiryDate);

// 30 days before expiry
const expiringSoonThreshold = new Date(expiry);
expiringSoonThreshold.setDate(expiringSoonThreshold.getDate() - 30);

let warrantyStatus;

if (expiry < now) {
  warrantyStatus = WarrantyStatus.EXPIRED;
} else if (now >= expiringSoonThreshold) {
  warrantyStatus = WarrantyStatus.EXPIRING_SOON;
} else {
  warrantyStatus = WarrantyStatus.ACTIVE;
}
warrantyData.warrantyStatus=warrantyStatus
    }
    if(body.providerName){
        warrantyData.providerName=body.providerName

    }
    if(body.startDate){
        warrantyData.startDate=body.startDate
    }

    const updatedWarranty=await prisma.warranties.update({where:{
        id:body.warrantyId
    },data:warrantyData})

    console.info("Warranty Edited successfully")
    return res.json(toWarrantyDTO(updatedWarranty))
    
}

export const findWarrantyByAsset=async(req:Request,res:Response)=>{
    
    const assetId=parseInt(req.params.assetId as string)
    console.info(`Retrieving warranty for user with id ${req.user?.userId} for asset with id ${assetId} `)
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10
    const orderBy =
  req.query.orderBy === "asc" || req.query.orderBy === "desc"
    ? req.query.orderBy
    : "desc";

    const warranties=await prisma.warranties.findMany({where:{
        assetId:assetId,asset:{
            userId:req.user?.userId
        }
    },orderBy:{
        createdAt:orderBy,},
    skip:pageNumber*pageSize,take:pageSize})

    return res.json(warranties.map(warranties=>toWarrantyDTO(warranties)))
}

export const uploadDocuments=async(req:Request<{warrantyId:string},{},WarrantyDocumentsSchema>,res:Response)=>{
    const warrantyId=parseInt(req.params.warrantyId)
    console.info(`Uploading warranty documents for warranty with id ${warrantyId} for user with id ${req.user?.userId}`)
    const warranty=await prisma.warranties.findUnique({where:{
        id:warrantyId,asset:{
            userId:req.user?.userId
        }
    }}) 
    if(warranty===null){
       throw new NotFoundException(`Warranty with id ${warrantyId} and userId ${req.user?.userId} not found `)
    }
    const file=req.file!



    

    return await prisma.$transaction(async(tx)=>{

        const fileKey=await uploadToS3(file)
        const warrantyDocument=await tx.warrantyDocuments.create({data:{
        warrantyId:warrantyId,
        fileSize:file?.size,
        mimeType:file.mimetype,
        fileKey:fileKey,
        name:req.body.name
        

    }})
    console.info("Document uploaded successfully")
     return res.json(warrantyDocument) 
    }
   
)

}

export const deleteWarrantyDocuments=async(req:Request,res:Response)=>{
    const documentId=parseInt(req.params.documentId)
    console.info(`Deleting warranty documents with id ${documentId} for user with id ${req.user?.userId} `)
    const warrantyDocument=await prisma.warrantyDocuments.findUnique({where:{
        id:documentId,warranties:{
            asset:{
                userId:req.user?.userId
            }
        }
    }})
    if(warrantyDocument===null){
        throw new NotFoundException(`Document with userId ${req.user?.userId} and id ${documentId} not found`)
    }
    return await prisma.$transaction(async(tx)=>{
        if(warrantyDocument.fileKey===null){
            throw new ConflictException("file key does not exist")
        }
        await deleteFromS3(warrantyDocument.fileKey)

        await tx.warrantyDocuments.delete({where:{
            id:documentId
        }})
        console.info("Document deleted successfully")
        return res.json("Document deleted")
    
    })
}

export const findDocumentByWarranty=async(req:Request,res:Response)=>{
    const warrantyId=parseInt(req.params.warrantyId as string)
    console.info(`Retrieving warranty documents for user with id ${req.user?.userId} warrantyId=${warrantyId}`)
    const pageNumber=parseInt(req.query.pageNumber as string)||0
    const pageSize=parseInt(req.query.size as string)||10
    const orderBy =
  req.query.orderBy === "asc" || req.query.orderBy === "desc"
    ? req.query.orderBy
    : "desc";

    const documents=await prisma.warrantyDocuments.findMany({where:{
        warrantyId:warrantyId,warranties:{
            asset:{
                userId:req.user?.userId
            }
        }
    },orderBy:{
        createdAt:orderBy
    },take:pageSize,skip:pageNumber*pageSize})
    return res.json(documents)
}

export const findWarrantyDocumentLink=async(req:Request,res:Response)=>{
    const documentId=parseInt(req.params.documentId)
    console.info(`Retrieving document link for user with id ${req.user?.userId} document id =${documentId}`)
    const warrantyDocument=await prisma.warrantyDocuments.findUnique({where:{
        id:documentId,warranties:{
            asset:{
                userId:req.user?.userId
            }
        }

        
    }})
    if(warrantyDocument===null){
        throw new NotFoundException(`Document with id ${documentId} and user Id ${req.user?.userId} not found`)
    }
    if(warrantyDocument.fileKey===null){
        throw new ConflictException("File key not found")
    }

    return res.json(await generatePresignedUrl(warrantyDocument.fileKey))
}

export const extractWarrantyInfoFromPdf=async(req:Request,res:Response)=>{
    const assetId=parseInt(req.params.assetId)
    const file=req.file!

    const asset=await prisma.assets.findUnique({where:{
        id:assetId,userId:req.user?.userId
    }})

    

    if(asset===null){
        throw new NotFoundException(`Asset with id ${assetId} and userId ${req.user?.userId} not found`)
    }

    const extracted = await extractFieldsFromPdf(req.file!.buffer)
return await prisma.$transaction(async(tx)=>{
    
    
    const { providerName, startDate, expiryDate, coverageNotes } = extracted

    if (!expiryDate) {
  throw new ConflictException("expiryDate cannot be null. Check your PDF extraction.");
}
     const now = new Date();
const expiry = new Date(expiryDate);

// 30 days before expiry
const expiringSoonThreshold = new Date(expiry);
expiringSoonThreshold.setDate(expiringSoonThreshold.getDate() - 30);

let warrantyStatus;

if (expiry < now) {
  warrantyStatus = WarrantyStatus.EXPIRED;
} else if (now >= expiringSoonThreshold) {
  warrantyStatus = WarrantyStatus.EXPIRING_SOON;
} else {
  warrantyStatus = WarrantyStatus.ACTIVE;
}

    const fileName = `${req.user?.userId}_${Date.now()}_${uuidv4()}.pdf`
    const fileKey=await uploadToS3(req.file!)
    const warranty=await tx.warranties.create({data:{
        providerName,startDate: new Date(startDate),expiryDate: new Date(expiryDate),coverageNotes,warrantyStatus,warrantyDocuments:{
            create:{
                name:fileName,
                mimeType:file.mimetype,
                fileSize:file.size,
                fileKey:fileKey
            }
        },asset:{
            connect:{
                id:assetId
            }
        }
    }})
    return res.json(toWarrantyDTO(warranty))
    
    

})
    



}



const changeWarrantyStatus=cron.schedule("0 9 * * *", async()=>{
console.info("Changing warranty status")
    const now = new Date();
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(now.getDate() + 30);

    await prisma.warranties.updateMany({
  where: { expiryDate: { lt: now } },
  data: { warrantyStatus: WarrantyStatus.EXPIRED },
});

await prisma.warranties.updateMany({
  where: {
    expiryDate: { gte: now, lt: thirtyDaysFromNow },
  },
  data: { warrantyStatus: WarrantyStatus.EXPIRING_SOON },
});

await prisma.warranties.updateMany({where:{
        expiryDate: { gt: thirtyDaysFromNow } 
    },data:{
        warrantyStatus:WarrantyStatus.ACTIVE
    }})
    console.info("Warranty status changed")


})
changeWarrantyStatus.start()

const sendWarrantyExpiryEMail=async(warranty:Warranties,asset:Assets,user:User)=>{
    const text= `
Hello,

This is a reminder that your warranty for "${asset.name}" is set to expire on ${warranty.expiryDate.toDateString()}.

Please take any necessary action before it expires.

Thank you,
Chaussy Team
    `
  
    await sendEmail({to:user.email,subject:"Warranty Reminder",text:text})
}

const sendExpiryEmail=async(warranty:Warranties,asset:Assets,user:User)=>{
   const text = `
Hello,

This is a notification that your warranty for "${asset.name}" has expired on ${warranty.expiryDate.toDateString()}.

Please take any necessary action if you wish to renew or review coverage.

Thank you,
Chaussy Team
`;

await sendEmail({to:user.email,subject:"Warranty Expired",text:text})
    
}

const send30DayEmail=cron.schedule("0 9 * * *", async()=>{
console.info("Sending 30 day email for warranties")   
    const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  const eightDaysFromNow=new Date()
  eightDaysFromNow.setDate(now.getDate()+8)

  const warranties = await prisma.warranties.findMany({
    where: {
      expiryDate: {
        lte: thirtyDaysFromNow,  // less than or equal to 30 days from now
        gte: eightDaysFromNow             // and greater than or equal to today
      },thirtyDayNotification:false,asset:{
        user:{
            userSetting:{
                enableEmailNotifications:true
            }
        }
      }
    },
    include:{
        asset:{
            include:{
                user:true
                
            }
        }
            
        
        
    }
    
    
  }
);

 await Promise.all(warranties.map(warranties=> sendWarrantyExpiryEMail(warranties,warranties.asset,warranties.asset.user)))
 
 const warrantyIds=warranties.map(w=>w.id)
 
 await prisma.warranties.updateMany({where:{id:{in: warrantyIds}   
  },data:{
    thirtyDayNotification:true
  }})

  console.info("Emails sent successfully")
  
  

})
send30DayEmail.start()

const send7DayEmail=cron.schedule("0 9 * * *", async()=>{
   console.info("Sending seven day notification")
    const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const warranties = await prisma.warranties.findMany({
    where: {
      expiryDate: {
        lte: sevenDaysFromNow,  // less than or equal to 30 days from now
        gte: now                 // and greater than or equal to today
      },sevenDayNotification:false,asset:{
        user:{
            userSetting:{
                enableEmailNotifications:true
            }
        }
      }
    },
    include:{
        asset:{
            include:{
                user:true
                
            }
        }
            
        
        
    }
    
  })
  ;

 await Promise.all(warranties.map(warranties=> sendWarrantyExpiryEMail(warranties,warranties.asset,warranties.asset.user)))
 
 const warrantyIds=warranties.map(w=>w.id)
 
 await prisma.warranties.updateMany({where:{id:{in: warrantyIds}   
  },data:{
    sevenDayNotification:true
  }})
  
console.info("Notification sent successfully")
})

send7DayEmail.start()


const sendExpiryDayEmail=cron.schedule("0 9 * * *", async()=>{
console.info("Sending expiry day notification for warranties")
    const now = new Date();
    // Yesterday
const yesterday = new Date();
yesterday.setDate(now.getDate() - 1);

// Start of yesterday
const startOfYesterday = new Date(yesterday);
startOfYesterday.setUTCHours(0, 0, 0, 0);

// End of yesterday
const endOfYesterday = new Date(yesterday);
endOfYesterday.setUTCHours(23, 59, 59, 999);

const warranties = await prisma.warranties.findMany({
  where: {
    expiryDate: {
      gte: startOfYesterday,
      lte: endOfYesterday,
    },finalNotification:false,
    asset: {
      user: {
        userSetting: {
          enableEmailNotifications: true,
        },
      },
    },
  },
  include: {
    asset: {
      include: {
        user: true,
      },
    },
  },
});

 await Promise.all(warranties.map(warranties=> sendExpiryEmail(warranties,warranties.asset,warranties.asset.user)))
 
 const warrantyIds=warranties.map(w=>w.id)
 
 await prisma.warranties.updateMany({where:{id:{in: warrantyIds}   
  },data:{
    finalNotification:true
  }})

 
  
console.info("Expiry sent successfully")
})
 sendExpiryDayEmail.start()

