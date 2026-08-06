import { z } from "zod";
import { isValidNigerianPhone } from "./phone";

export const childEntrySchema = z.object({
  id: z.string(),
  age: z.number().min(0, "Age must be at least 0").max(17, "Age must be under 18"),
  gender: z.enum(["male", "female"]),
});

export const rsvpFormSchema = z
  .object({
    guestFullName: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters")
      .refine(
        (val) => val.trim().split(/\s+/).length >= 2,
        "Please enter both your first and last name"
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address (e.g. name@example.com)"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine(
        (val) => isValidNigerianPhone(val),
        "Please enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)"
      ),
    isAttending: z.boolean(),
    hasPlusOne: z.boolean(),
    plusOneName: z.string().trim(),
    children: z.array(childEntrySchema),
    hasNanny: z.boolean(),
    nannyCount: z.number().min(0).max(5),
    dietaryNotes: z.string().trim(),
    messageToCelebrant: z
      .string()
      .trim()
      .max(300, "Message cannot exceed 300 characters"),
  })
  .superRefine((data, ctx) => {
    // If attending and bringing a plus-one, plus-one name is required
    if (data.isAttending && data.hasPlusOne) {
      if (!data.plusOneName || data.plusOneName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["plusOneName"],
          message: "Please enter your plus-one's full name",
        });
      }
    }

    // If attending and bringing nanny, nanny count must be >= 1
    if (data.isAttending && data.hasNanny) {
      if (data.nannyCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nannyCount"],
          message: "Please specify at least 1 nanny/caretaker",
        });
      }
    }
  });

export type RsvpSchemaType = z.infer<typeof rsvpFormSchema>;
