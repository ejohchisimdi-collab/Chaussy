import { Request, Response } from "express";
import { LoginSchema, RegisterUserSchema } from "./schema.js";
import bcrypt from 'bcrypt';
import { prisma } from "../prisma/client.js";
import { User } from "@prisma/client";
import { email, jwt } from "zod/v4";
import { profile } from "console";
import { NotFound } from "@aws-sdk/client-s3";
import { BadRequestException, ConflictException, InvalidCredentialsException, NotFoundException } from "../middleware/exceptions.js";
import { generateToken } from "../middleware/authMiddleware.js";
import { deleteFromS3, generatePresignedUrl, uploadToS3 } from "../middleware/s3Service.js";
import { sendEmail } from "../middleware/sendgrid.js";

const toUserDTO=(user:User)=>{return{
    id:user.id,
    name:user.name,
    email:user.email,
    profileKey:user.profileKey,
    isEmailConfirmed:user.isEmailConfirmed

}}

export const registerUser=async(req:Request<{},{},RegisterUserSchema>,res:Response)=>{
    console.log(`Registering user with email ${req.body.email} at ${new Date()}`)
    req.body.password=await bcrypt.hash(req.body.password, 10)
    const userData=req.body
    const user=await prisma.user.create({data:{
        name:userData.name,
        email:userData.email,
        password:userData.password
    }})
    console.log(`user registered successfully`)
    return res.json(toUserDTO(user))
}

export const logIn=async(req:Request<{},{},LoginSchema>,res:Response)=>{
    console.log(`Logging in user with email ${req.body.email} at ${new Date()}`)
    const loginData=req.body
    const user=await prisma.user.findUnique({where:{
        email:loginData.email
    }})
    if(user===null){
        throw new NotFoundException("User with email "+loginData.email+" not found")

    }
    if(! await bcrypt.compare(loginData.password, user.password)){
        throw new InvalidCredentialsException("Password Invalid")
    }
    const token=generateToken({userId:user.id,email:user.email})

    console.log("User logged in successfully")
    return res.json(token)

}

export const viewProfile=async(req:Request,res:Response)=>{
    console.log(`Viewing profile of user with id ${req.user?.userId}`)
    const user=await prisma.user.findUnique({where:{
        id:req.user?.userId
    }}) 
    return res.json(toUserDTO(user!))
}

export const uploadProfilePicture=async(req:Request,res:Response)=>{
    console.log(`Uploading profile picture for user with id ${req.user?.userId}`)
return await prisma.$transaction(async(tx)=>{  if(req.file==null){
        throw new ConflictException("File needed")
    }
    const key=await uploadToS3(req.file)

    const user=await tx.user.update({where:{
        id:req.user?.userId
    },data:{
        profileKey:key
    }})
console.log(`Profile picture uploaded successfully`)
return res.json(toUserDTO(user))

})}
    
export const deleteProfilePicture=async(req:Request,res:Response)=>{
    console.log(`Deleting profile Picture for user with id ${req.user?.userId} at ${new Date()}`)
    const user=await prisma.user.findUnique({where:{
        id:req.user?.userId
    }})
    if(user?.profileKey===null){
        throw new ConflictException("No profile picture Exists for user with Id "+req.user?.userId)
    }
    return await prisma.$transaction(async(tx)=>{
        await deleteFromS3(user!.profileKey!)
        const newUser=await tx.user.update({where:{
            id:req.user?.userId
        },data:{
            profileKey:null
        }})
        console.log("Profile picture deleted successfully")
        return res.json(toUserDTO(newUser))
        
    })
    

}

export const viewProfilePicture=async(req:Request,res:Response)=>{
    console.info(`viewing profile picture of user with id ${req.user?.userId}  `)
    const user=await prisma.user.findUnique({where:{
        id:req.user?.userId
    }})
    if(user?.profileKey===null){
        throw new ConflictException("user with id "+user?.id+" has no profile pictures")
    }
    return res.json(await generatePresignedUrl(user?.profileKey!))
}


export function generateAlphaNumCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return code;
}

export const  generateEmailConfirmationCode=async(req:Request,res:Response)=>{
 console.info(`Generating email confirmation code for user with id ${req.user?.userId}`)
    const user=await prisma.user.findUnique({where:{
        id:req.user?.userId
    }})
    const code=generateAlphaNumCode();

    const codeToBeSaved= await bcrypt.hash(code, 10)
const expiresAt = new Date(Date.now() + 30 * 60 * 1000); 
    await prisma.confirmEmail.create({data:{
        userId:user?.id!,
        emailCode :codeToBeSaved,
        expiresAt:expiresAt,
        revoked:false
        
    }})

const text=`
Hi ${user?.name},

We received a request to reset your Chaussy password. Use the code below to reset your password:

${code}

This code will expire in 30 minutes. If you didn't request a password reset, please ignore this email.

Thanks,
The Chaussy Team
`
    await sendEmail({to:user?.email!,subject:"Password Reset",text:text})

    console.log(`Code sent successfully`)
    return res.json("email sent")
}



export const verifyEmail=async(req:Request,res:Response)=>{
console.info(`Confirming email for user with id ${req.user?.userId}  `)
    const code=req.query.code
  if(code===null){
    throw new BadRequestException("code query param needed")
  }

  return await prisma.$transaction(async(tx)=>{
    
    const emailVerification=await tx.confirmEmail.findFirst({where:{

    userId:req.user?.userId,
    revoked:false

  },orderBy:{
    issuedAt:"desc"
  }})

  if(emailVerification===null){
    throw new NotFoundException("Verification not found")
  }
  if(emailVerification.expiresAt<new Date()){
    await prisma.confirmEmail.update({where:{
        id:emailVerification.id
    },data:{
        revoked:true
    }})
    throw new ConflictException("Code has expired")
  }

  if(!await bcrypt.compare(code as string, emailVerification.emailCode)){
    throw new ConflictException("Code not valid")
  }

  const user=await tx.user.update({where:{
    id:req.user?.userId
  },data:{
    isEmailConfirmed:true
  }})

  await tx.confirmEmail.update({where:{
    id:emailVerification.id
  },data:{
    revoked:true
  }})

  console.info("Email confirmed successfully")
  return res.json(toUserDTO(user))

})
  
  
} 




