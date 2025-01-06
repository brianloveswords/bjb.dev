import { defineCollection, z } from "astro:content";

const log = defineCollection({
  type: "content",
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    unlisted: z.boolean().optional(),
  }),
});

export const collections = { log };
