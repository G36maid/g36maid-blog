import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * post — full technical articles / tutorials (main content)
 * note — short TIL-style notes and quick logs
 */
const post = defineCollection({
	loader: glob({ base: './src/content/post', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updated: z.coerce.date().optional(),
		category: z.string().default('general'),
		tags: z.array(z.string()).default([]),
		series: z.string().optional(),
		lang: z.string().default('zh-Hant'),
		draft: z.boolean().default(false),
	}),
});

const note = defineCollection({
	loader: glob({ base: './src/content/note', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

export const collections = { post, note };
