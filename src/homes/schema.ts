import { PropertyType } from "@prisma/client";
import { homedir } from "os";
import z from "zod";

export const AddHomeSchema = z.object({
  yearBuilt: z
    .number()
    .int()
    .min(1800, "Year is too old")
    .max(new Date().getFullYear(), "Year cannot be in the future").optional(),

  address: z
    .string()
    .min(5, "Address too short")
    .max(255, "Address too long").optional(),

  propertyType: z.nativeEnum(PropertyType)})

export type AddHomeSchema=z.infer<typeof AddHomeSchema>

export const EditHomeSchema = z.object({

    homeId:z.number().positive(),
    yearBuilt: z
    .number()
    .int()
    .min(1800, "Year is too old")
    .max(new Date().getFullYear(), "Year cannot be in the future").optional(),

  address: z
    .string()
    .min(5, "Address too short")
    .max(255, "Address too long").optional(),

  propertyType: z.nativeEnum(PropertyType).optional()})

  export type EditHomeSchema=z.infer<typeof EditHomeSchema>