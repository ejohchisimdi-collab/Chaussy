import z from "zod";

export const EditUserSettingSchema=z.object({
    enableEmailNotifications:z.boolean().optional()
})

export type EditUserSettingSchema=z.infer<typeof EditUserSettingSchema>