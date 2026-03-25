import z from "zod";

export const AddRoomSchema = z.object({
    homeId:z.number().positive(),
  name: z.string().min(1, "Name is required"),       // required
  roomSize: z.number().int().positive().optional(),  // optional
  floorLevel: z.number().int().optional(),           // optional
});

export type AddRoomSchema=z.infer<typeof AddRoomSchema>

export const EditRoomSchema=z.object({
  roomId:z.number().positive(),
    name: z.string().min(1, "Name is required").optional(),       // required
  roomSize: z.number().int().positive().optional(),  // optional
  floorLevel: z.number().int().optional(),           // optional
})

export type EditRoomSchema=z.infer<typeof EditRoomSchema>