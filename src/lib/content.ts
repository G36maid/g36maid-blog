import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'post'>;
export type Note = CollectionEntry<'note'>;

/** drafts are visible in dev, hidden in prod builds */
function isPublic(entry: { data: { draft: boolean } }): boolean {
	return import.meta.env.DEV || !entry.data.draft;
}

/** all posts, newest first (the 'about' briefing file is rendered on its own page) */
export async function getSortedPosts(): Promise<Post[]> {
	const posts = await getCollection('post', (entry) => entry.id !== 'about' && isPublic(entry));
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** all notes, newest first */
export async function getSortedNotes(): Promise<Note[]> {
	const notes = await getCollection('note', isPublic);
	return notes.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** posts filtered by tag */
export async function getPostsByTag(tag: string): Promise<Post[]> {
	const posts = await getSortedPosts();
	return posts.filter((post) => post.data.tags.includes(tag));
}

/** posts filtered by category slug */
export async function getPostsByCategory(category: string): Promise<Post[]> {
	const posts = await getSortedPosts();
	return posts.filter((post) => post.data.category === category);
}

/** unique category slug → post count map (public posts only) */
export async function getCategoryCounts(): Promise<Map<string, number>> {
	const posts = await getSortedPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		const c = post.data.category;
		counts.set(c, (counts.get(c) ?? 0) + 1);
	}
	return counts;
}

/** unique tag → post count map */
export async function getTagCounts(): Promise<Map<string, number>> {
	const posts = await getSortedPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return counts;
}

/** sister posts sharing the same series, ordered */
export function getSeriesNeighbors(series: string, current: Post, all: Post[]): { prev?: Post; next?: Post } {
	const inSeries = all
		.filter((post) => post.data.series === series)
		.sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
	const i = inSeries.findIndex((post) => post.id === current.id);
	if (i === -1) return {};
	return {
		prev: i > 0 ? inSeries[i - 1] : undefined,
		next: i < inSeries.length - 1 ? inSeries[i + 1] : undefined,
	};
}


/** category display labels (slug → zh/en label) — scripts/classify.py writes these slugs;
	   unknown slugs fall back to the raw slug */
export const CATEGORY_LABELS: Record<string, string> = {
	linux: 'Linux',
	'self-hosting': 'Self-hosting',
	programming: 'Programming',
	ai: 'AI',
	security: 'Security',
	hardware: 'Hardware',
	acg: 'ACG',
	blog: 'Blog',
	work: 'Work',
	life: 'Life',
	shitpost: '廢文',
	essay: '隨筆',
	astro: 'Astro',
	meta: 'Meta',
};

/** display label for a category slug, falling back to the raw slug */
export function categoryLabel(category: string): string {
	return CATEGORY_LABELS[category] ?? category;
}

/** first image in the post body — used as the list thumbnail (videos skipped,
 *  relative media paths normalized to the site root) */
const COVER_RE = /!\[[^\]]*\]\(([^)\s]+)|<img[^>]*?src=["']([^"']+)["']/gi;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(?=$|[)"\s])/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(?=$|[")?#])/i;

export function postCover(post: Post): string | undefined {
	for (const m of (post.body ?? '').matchAll(COVER_RE)) {
		const raw = (m[1] ?? m[2]).trim();
		if (VIDEO_EXT.test(raw) || !IMAGE_EXT.test(raw)) continue;
		return /^(https?:)?\/\//.test(raw) || raw.startsWith('/')
			? raw
			: '/' + raw.replace(/^(?:\.\.\/|\.\/)+/, '');
	}
	return undefined;
}
