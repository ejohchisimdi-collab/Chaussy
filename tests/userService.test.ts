import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma/client";
import { PrismaClient, User } from "@prisma/client";
import { Request, response, Response } from "express";
import { LoginSchema, RegisterUserSchema } from "../src/user/schema";
import { generateAlphaNumCode, generateEmailConfirmationCode, logIn, registerUser, uploadProfilePicture, verifyEmail } from "../src/user/userService";
import { ConflictException, InvalidCredentialsException, NotFoundException } from "../src/middleware/exceptions";
import { partial } from "zod/v4-mini";
import { generateToken } from "../src/middleware/authMiddleware";
import { generateRefreshToken, setRefreshCookie } from "../src/refresh/refreshService";
import { email, file } from "zod/v4";
import { deleteFromS3, uploadToS3 } from "../src/middleware/s3Service";
import { Multer } from "multer";
import { sendEmail } from "../src/middleware/sendgrid";
import { tr } from "zod/v4/locales";



jest.mock("../src/prisma/client.js", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare:jest.fn()
}));

jest.mock("../src/middleware/authMiddleware.ts",()=>({
    generateToken:jest.fn()
}))
jest.mock("../src/refresh/refreshService.ts",()=>({
    generateRefreshToken:jest.fn(),
    setRefreshCookie:jest.fn()
}))

jest.mock("../src/middleware/s3Service.ts",()=>({

    uploadToS3:jest.fn(),
    deleteFromS3:jest.fn()
}))

jest.mock("../src/middleware/sendgrid.ts",()=>({
    sendEmail:jest.fn()
}))






const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("Register user", () => {
  let req: Partial<Request<{}, {}, RegisterUserSchema>>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      json: jest.fn(),
    };
  });

  it("should register a user successfully and create user setting", async () => {
    req = {
      body: {
        name: "chisimdi",
        email: "ejohc@gmail.com",
        password: "forever20",
        acceptedPrivacyPolicy: true,
      },
    };

    // ✅ mock return values
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

    prismaMock.user.create.mockResolvedValue({
      id: "1",
      name: "chisimdi",
      email: "ejohc@gmail.com",
      password: "hashed-password",
    } as any);

    prismaMock.userSetting.create.mockResolvedValue({} as any);

    await registerUser(req as Request, res as Response);

    expect(prismaMock.user.create).toHaveBeenCalled();

    expect(bcrypt.hash).toHaveBeenCalledWith("forever20", expect.any(Number));

    expect(prismaMock.userSetting.create).toHaveBeenCalled();
  })

  it("Should Throw a conflict exception from privacy policy not accepted",async()=>{
    req={body:{
         name: "chisimdi",
        email: "ejohc@gmail.com",
        password: "forever20",
        acceptedPrivacyPolicy: false,
      },

    }
    expect( registerUser(req as Request,res as Response)).rejects.toThrow(ConflictException)
},



);
  
})

describe("login",()=>{
    beforeEach(()=>{
    jest.clearAllMocks()
    })
    
    let req:Partial<Request<{},{},LoginSchema>>;
    let res:Partial<Response>={
        json:jest.fn()
    }
    req={
        body:{
            email:"chi",
            password:"1877"
        }
    }
    

    it("Should return an acess token and generate a refresh token",async()=>{
        
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:true});
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        prismaMock.$transaction.mockImplementation(async (callback) => {
    return callback(prismaMock); // make the transaction run
  });

        (prismaMock.user.update as  jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:true});
        (generateToken as jest.Mock).mockReturnValue("abcd");
        (generateRefreshToken as jest.Mock).mockResolvedValue("cde");
        (setRefreshCookie as jest.Mock)

        const acessToken=await logIn(req as Request,res as Response)


        expect(res.json).toHaveBeenNthCalledWith(1,{accessToken:"abcd"});
        expect(generateRefreshToken).toHaveBeenCalled()
        expect(generateRefreshToken).toHaveBeenCalled();

    })

    it("should throw privacy policy exception ",async()=>{

        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:false});
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        prismaMock.$transaction.mockImplementation(async (callback) => {
    return callback(prismaMock); // make the transaction run
  });

        (prismaMock.user.update as  jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:false});
        (generateToken as jest.Mock).mockReturnValue("abcd");
        (generateRefreshToken as jest.Mock).mockResolvedValue("cde");
        (setRefreshCookie as jest.Mock)

       await expect( logIn(req as Request,res as Response)).rejects.toThrow(ConflictException)


        
    })

    it("should throw Invalid credentials Exception",async()=>{
         (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:true});
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        prismaMock.$transaction.mockImplementation(async (callback) => {
    return callback(prismaMock); // make the transaction run
  });

        (prismaMock.user.update as  jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:false});
        (generateToken as jest.Mock).mockReturnValue("abcd");
        (generateRefreshToken as jest.Mock).mockResolvedValue("cde");
        (setRefreshCookie as jest.Mock)

        await expect( logIn(req as Request,res as Response)).rejects.toThrow(InvalidCredentialsException)


        
    })
    it("should throw not found Exception ",async()=>{
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        prismaMock.$transaction.mockImplementation(async (callback) => {
    return callback(prismaMock); // make the transaction run
  });

        (prismaMock.user.update as  jest.Mock).mockResolvedValue({name:"Chisimdi",email:"chisimdi",password:"chismdi",acceptedV1PrivacyPolicy:false});
        (generateToken as jest.Mock).mockReturnValue("abcd");
        (generateRefreshToken as jest.Mock).mockResolvedValue("cde");
        (setRefreshCookie as jest.Mock)

     await   expect( logIn(req as Request,res as Response)).rejects.toThrow(NotFoundException)


        
    })

})

describe("Upload profile picture",()=>{
    beforeEach(()=>{
        jest.clearAllMocks()
    })
   let req:Partial<Request> & { file?: Express.Multer.File }={
    user:{
        userId:1,
        email:"ejohc"
    }
   }
   let res:Partial<Response>={
    json:jest.fn()
   }

   it("SHould return a file key and upload to s3",async()=>{
    prismaMock.$transaction.mockImplementation(async(callback)=>{
        return callback(prismaMock)
    });

    req.file ={
  fieldname: "file",
  originalname: "profile.png",
  encoding: "7bit",
  mimetype: "image/png",
  buffer: Buffer.from("test"),
  size: 12345
    }as Express.Multer.File
    
    (uploadToS3 as jest.Mock).mockResolvedValue("abc");
    (prismaMock.user.update as jest.Mock).mockResolvedValue({email:"ejohc",profileKey:"abc"})

    await uploadProfilePicture(req as Request,res as Response)

    expect(uploadToS3).toHaveBeenCalled()
   expect(prisma.user.update).toHaveBeenCalled()

})

it("should throw a conflict exception",async()=>{
req.file=undefined
    prismaMock.$transaction.mockImplementation(async(callback)=>{
        return callback(prismaMock)
    });

    
    
    (uploadToS3 as jest.Mock).mockResolvedValue("abc");
    (prismaMock.user.update as jest.Mock).mockResolvedValue({email:"ejohc",profileKey:"abc"})

  await expect(uploadProfilePicture(req as Request,res as Response)).rejects.toThrow(ConflictException)

    
})
   })

   describe("Generate Email confirmation Code",()=>{
   
    beforeEach(()=>
        jest.clearAllMocks())

   let  req:Partial<Request>={
    user:{
        userId:1,
        email:"ejohc"
    }
    
        
    }
    let res:Partial<Response>={
        json:jest.fn()

    }
    
    it("Should send an email",async()=>{

        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({email:"ejohc"});
        (prismaMock.confirmEmail.create as jest.Mock).mockResolvedValue({});
    

        await generateEmailConfirmationCode(req as Request,res as Response)

        expect(sendEmail).toHaveBeenCalled()
        expect(prismaMock.confirmEmail.create).toHaveBeenCalled()
        expect(prisma.user.findUnique).toHaveBeenCalled()

    })
   })

   describe("Verify email",()=>{
    beforeEach(()=>
        jest.clearAllMocks())

    let req:Partial<Request>={
        user:{
            userId:1,
            email:"ejohc"
        },
        query:{
            code:"abc"
        }
    }
    let res:Partial<Response>={
        json:jest.fn()
    }

    it("Should verify email successfully",async()=>{

        prismaMock.$transaction.mockImplementation(async(callback)=>{
            return callback(prismaMock)
        });
        (prismaMock.confirmEmail.findFirst as jest.Mock).mockResolvedValue({emailCode:"abc",expiresAt:new Date(new Date().getTime()+10000)});
       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prismaMock.user.update as jest.Mock).mockResolvedValue({isEmailConfirmed:true});
        (prismaMock.confirmEmail.update as jest.Mock).mockResolvedValue({});


        await verifyEmail(req as Request,res as Response)

        expect(prisma.user.update).toHaveBeenCalled()
        expect(prisma.confirmEmail.update).toHaveBeenCalled()


    })
    it("Should throw for invalid code",async()=>{

        prismaMock.$transaction.mockImplementation(async(callback)=>{
            return callback(prismaMock)
        });
        (prismaMock.confirmEmail.findFirst as jest.Mock).mockResolvedValue({emailCode:"abc",expiresAt:new Date(new Date().getTime()+10000)});
       (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        (prismaMock.user.update as jest.Mock).mockResolvedValue({isEmailConfirmed:true});
        (prismaMock.confirmEmail.update as jest.Mock).mockResolvedValue({});


        await expect (verifyEmail(req as Request,res as Response)).rejects.toThrow(ConflictException)



        

    })
    it("Should throw for expired code",async()=>{

        prismaMock.$transaction.mockImplementation(async(callback)=>{
            return callback(prismaMock)
        });
        (prismaMock.confirmEmail.findFirst as jest.Mock).mockResolvedValue({emailCode:"abc",expiresAt:new Date(new Date().getTime()-10000)});
       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prismaMock.user.update as jest.Mock).mockResolvedValue({isEmailConfirmed:true});
        (prismaMock.confirmEmail.update as jest.Mock).mockResolvedValue({});


        await expect (verifyEmail(req as Request,res as Response)).rejects.toThrow(ConflictException)



        

    })
    it("Should throw for no code found",async()=>{

        prismaMock.$transaction.mockImplementation(async(callback)=>{
            return callback(prismaMock)
        });
        (prismaMock.confirmEmail.findFirst as jest.Mock).mockResolvedValue(null);
       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prismaMock.user.update as jest.Mock).mockResolvedValue({isEmailConfirmed:true});
        (prismaMock.confirmEmail.update as jest.Mock).mockResolvedValue({});


        await expect (verifyEmail(req as Request,res as Response)).rejects.toThrow(NotFoundException)



        

    })
    
   })


