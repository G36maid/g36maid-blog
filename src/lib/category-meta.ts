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
	/* all geometry derives from the viewBox — no hand-maintained centers */
	const VIEW = 30; // square badge canvas
	const FRAME_MARGIN = 1.5; // white frame inset
	const FIELD = 22; // flat color field, centered
	const ICON_GRID = 24; // vendored icon grid
	const GLYPH_SCALE = 0.58; // glyph ≈ 14px inside the 22px field

	const d = glyphPath(slug);
	const fieldX = (VIEW - FIELD) / 2;
	const s = GLYPH_SCALE;
	const o = (VIEW / 2 - (ICON_GRID / 2) * s).toFixed(2);
	const frame = VIEW - FRAME_MARGIN * 2;
	return (
		`<svg viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true">` +
		`<rect x="${FRAME_MARGIN}" y="${FRAME_MARGIN}" width="${frame}" height="${frame}" fill="#fff"/>` +
		`<rect x="${fieldX}" y="${fieldX}" width="${FIELD}" height="${FIELD}" fill="${color}"/>` +
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
