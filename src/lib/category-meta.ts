/**
 * Per-category "operator badge": accent color + a white glyph from a vendored
 * icon set. Square badge, no chamfer: white frame → flat color field →
 * white glyph. No shadow, no hover treatment.
 *
 * Icons are downloaded from api.iconify.design and vendored in
 * src/assets/category-icons/ — Pictogrammers Material Design Icons
 * (Apache-2.0), simple-icons for the Astro mark (CC0).
 */
export interface CategoryMeta {
	color: string;
	svg: string;
}

const GLYPHS = import.meta.glob<string>('/src/assets/category-icons/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true,
});

/** all `d` attributes of an icon file, concatenated (single-path sets in practice) */
function glyphPath(slug: string): string {
	const raw = GLYPHS[`/src/assets/category-icons/${slug}.svg`];
	if (!raw) return '';
	return [...raw.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(' ');
}

function badgeSvg(color: string, slug: string): string {
	/* 24×24 icon grid scaled into the 22×22 color field, centered on the badge */
	const d = glyphPath(slug);
	const s = 0.58;
	const o = (15 - 12 * s).toFixed(2);
	return (
		`<svg viewBox="0 0 30 30" aria-hidden="true">` +
		`<rect x="1.5" y="1.5" width="27" height="27" fill="#fff"/>` +
		`<rect x="4" y="4" width="22" height="22" fill="${color}"/>` +
		`<g transform="translate(${o},${o}) scale(${s})" fill="#fff"><path d="${d}"/></g>` +
		`</svg>`
	);
}

function meta(color: string, slug: string): CategoryMeta {
	return { color, svg: badgeSvg(color, slug) };
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
	linux: meta('#1487e8', 'linux'),
	'self-hosting': meta('#29b329', 'self-hosting'),
	programming: meta('#f2b705', 'programming'),
	ai: meta('#8e44ec', 'ai'),
	security: meta('#d92b2b', 'security'),
	hardware: meta('#f97316', 'hardware'),
	acg: meta('#ec4899', 'acg'),
	blog: meta('#00a8d8', 'blog'),
	work: meta('#9aa7b0', 'work'),
	life: meta('#a05a2c', 'life'),
	shitpost: meta('#ffd60a', 'shitpost'),
	essay: meta('#c9d1d9', 'essay'),
	astro: meta('#ff5d01', 'astro'),
	meta: meta('#8f9ba4', 'meta'),
};

/** fallback for slugs outside the known taxonomy */
export const DEFAULT_CATEGORY_META: CategoryMeta = meta('#8f9ba4', 'category');

export function categoryMeta(slug: string): CategoryMeta {
	return CATEGORY_META[slug] ?? DEFAULT_CATEGORY_META;
}
