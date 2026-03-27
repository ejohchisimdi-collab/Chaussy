import z from "zod";

export const AddWarrantySchema = z.object({
 
    assetId:z.number().positive(),
    providerName: z
    .string()
    .min(2, "Provider name must be at least 2 characters")
    .max(100, "Provider name too long")
    .trim(),

  startDate: z
    .coerce.date()
    .optional(),

  expiryDate: z
    .coerce.date({
      errorMap: () => ({ message: "Invalid expiry date" })
    }),

  coverageNotes: z
    .string()
    .max(500, "Notes too long")
    .optional()
    .nullable()
});

export type AddWarrantySchema=z.infer<typeof AddWarrantySchema>

export const EditWarrantySchema = z.object({
 
    warrantyId:z.number().positive(),
    providerName: z
    .string()
    .min(2, "Provider name must be at least 2 characters")
    .max(100, "Provider name too long")
    .trim().optional(),

  startDate: z
    .coerce.date()
    .optional(),

  expiryDate: z
    .coerce.date({
      errorMap: () => ({ message: "Invalid expiry date" })
    }).optional(),

  coverageNotes: z
    .string()
    .max(500, "Notes too long")
    .optional()
    .nullable()
});

export type EditWarrantySchema=z.infer<typeof EditWarrantySchema>

export const WarrantyDocumentSchema=z.object({
  name: z
    .string()
    .min(2, "name must be at least 2 characters")
    .max(100, " name too long")
    .trim(),  
})

export type WarrantyDocumentsSchema=z.infer<typeof WarrantyDocumentSchema>