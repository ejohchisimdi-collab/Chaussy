import { Request, Response } from "express";
import { ConflictException, NotFoundException } from "../middleware/exceptions.js";
import { prisma } from "../prisma/client.js";
import bcrypt from 'bcrypt'
import { generateAlphaNumCode } from "../user/userService.js";
import { sendEmail } from "../middleware/sendgrid.js";
import { ConfirmPasswordResetSchema } from "./schema.js";
import z from "zod";
import { email } from "zod/v4";

export const generatePassWordReset=async(req:Request,res:Response)=>{
const email=req.query.email as string
if(email===null){
    throw new ConflictException("email query param expected")
}
const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
return await prisma.$transaction(async(tx)=>{
   const user= await tx.user.findUnique({where:{
        email:email
    }})
    if(user===null){
        throw new NotFoundException("Invalid email")
    }
    if(user.isEmailConfirmed===false){
        throw new ConflictException("Needs email to be verified for feature to work")
    }
    const code=generateAlphaNumCode()
    const codeToBeSaved=await bcrypt.hash(code, 10)
    const resetText= `Hi ${user.name},

We received a request to reset your Chaussy password.

Your password reset code is:
${code}

This code will expire in 30 minutes.

If you didn’t request this, you can safely ignore this email.

— Chaussy Team`;
    const passwordReset=await prisma.passwordReset.create({data:{
        email:email,
        expiresAt:expiresAt,
        revoked:false,
        passwordKey:codeToBeSaved

    }})

 await sendEmail({to:user.email,subject:"Password Reset",text:resetText})

    return res.json("Message sent")


    
})
}

export const confirmPasswordReset=async(req:Request<{},{},ConfirmPasswordResetSchema>,res:Response)=>{
    const passwordData=req.body

return await prisma.$transaction(async(tx)=>{
  const passwordReset=  await tx.passwordReset.findFirst({where:{
        email:passwordData.email,
        revoked:false
    },orderBy:{
        issuedAt:"desc"
    }})
if(passwordReset===null){
    throw new ConflictException("No code sent for email"+passwordData.email)
}
    if(passwordReset?.expiresAt <new Date()){
        await tx.passwordReset.update({where:{
            id:passwordReset.id
        },data:{
            revoked:true
        }})
        throw new ConflictException("Code expired")
    }

    if(!await bcrypt.compare(passwordData.code, passwordReset.passwordKey)){
        throw new ConflictException("Invalid code")
    }

    const newPassword=await bcrypt.hash(passwordData.newPassword, 10)
    const user=await tx.user.update({where:{
        email:passwordData.email
    },data:{
        password:newPassword
    }})

     await tx.passwordReset.update({where:{
            id:passwordReset.id
        },data:{
            revoked:true
        }})

    
        return res.json("Password Changed")

    



})

}


