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

/** Layer:XX code for a post — its 1-based position in the chronology */
export function layerCode(posts: Post[], post: Post): string {
	const i = posts.findIndex((p) => p.id === post.id);
	return `Layer:${String(posts.length - i).padStart(2, '0')}`;
}

/** category display labels (slug → zh/en label) — scripts/classify.py writes these slugs */
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
};

/** TD-style category code, e.g. "astro" → "TD-ASTRO" */
export function categoryCode(category: string): string {
	return `TD-${category.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-')}`;
}

/** display label for a category slug, falling back to the TD code */
export function categoryLabel(category: string): string {
	return CATEGORY_LABELS[category] ?? categoryCode(category);
}
