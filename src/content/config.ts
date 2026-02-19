import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string(),
      date: z.date(),
      description: z.string(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional().default(false),
    })
    .strict(),
});

export const collections = { blog };
