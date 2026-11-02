import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

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
		/** provenance for imported content (e.g. 'facebook') */
		source: z.string().optional(),
		sourceType: z.string().optional(),
		sourceTimestamp: z.number().optional(),
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

/**
 * friend — blogroll entries in a single JSON file; add an object per friend
 * (id = unique slug, e.g. "ivonblog"); rendered on /friends/
 */
const friend = defineCollection({
	loader: file('./src/data/friends.json'),
	schema: z.object({
		name: z.string(),
		url: z.string().url(),
		description: z.string().default(''),
		avatar: z.string().url().optional(),
	}),
});

/**
 * event — home carousel slides in a single JSON file. Each entry pins one
 * slide: either a post by id (title/cover auto-filled) or a custom link
 * with title + image. Unpinned slots auto-fill with the latest posts.
 */
const event = defineCollection({
	loader: file('./src/data/events.json'),
	schema: z
		.object({
			post: z.string().optional(),
			href: z.string().optional(),
			title: z.string().optional(),
			image: z.string().optional(),
		})
		.refine((e) => e.post || e.href, { message: 'event slide needs a post id or an href' }),
});

export const collections = { post, note, friend, event };
