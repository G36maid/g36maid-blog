/**
 * Per-category "operator badge": accent color + white glyph with a black
 * offset shadow — the R6 patch look (chunky fill, black detail ink), drawn
 * programmatically so every icon shares one construction: shadow copy →
 * white shape → black ink details. Square badge, no chamfer.
 */
export interface CategoryMeta {
	color: string;
	svg: string;
}

function badgeSvg(color: string, shape: string, ink = ''): string {
	/* patch construction: white frame → flat color field → black offset shadow →
	   white glyph (scaled to fill the field) → black ink details. square corners. */
	const field = 'translate(15,15) scale(1.0) translate(-12,-12)';
	return (
		`<svg viewBox="0 0 30 30" aria-hidden="true">` +
		`<rect x="1.5" y="1.5" width="27" height="27" fill="#fff"/>` +
		`<rect x="4" y="4" width="22" height="22" fill="${color}"/>` +
		`<g transform="translate(16.4,16.4) scale(1.0) translate(-12,-12)" fill="#101418" stroke="#101418" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${shape}</g>` +
		`<g transform="${field}" fill="#fff" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${shape}</g>` +
		`<g transform="${field}" stroke="#101418" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">${ink}</g>` +
		`</svg>`
	);
}

function meta(color: string, shape: string, ink = ''): CategoryMeta {
	return { color, svg: badgeSvg(color, shape, ink) };
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
	linux: meta(
		'#1487e8',
		'<rect x="3" y="4.5" width="18" height="15" rx="1.5"/>',
		'<path d="M7 9.5l3 3-3 3M12.5 15.5h5"/>',
	),
	'self-hosting': meta(
		'#29b329',
		'<rect x="3" y="4" width="18" height="7" rx="1.2"/><rect x="3" y="13" width="18" height="7" rx="1.2"/>',
		'<path d="M6.8 7.5h.01M6.8 16.5h.01M17 7.5h-5M17 16.5h-5"/>',
	),
	programming: meta(
		'#f2b705',
		'<path d="M8 6.5 3.5 12 8 17.5"/><path d="M16 6.5 20.5 12 16 17.5"/><path d="M13.2 4.5l-2.4 15"/>',
	),
	ai: meta(
		'#8e44ec',
		'<circle cx="12" cy="5.5" r="2.6"/><circle cx="5" cy="18" r="2.6"/><circle cx="19" cy="18" r="2.6"/><path d="M12 8v3.5m0 0-5.4 4.6M12 11.5l5.4 4.6"/>',
	),
	security: meta(
		'#d92b2b',
		'<path d="M12 2.8l7.2 2.9v5.5c0 4.9-3.1 8.4-7.2 10-4.1-1.6-7.2-5.1-7.2-10V5.7z"/>',
		'<path d="m9.2 11.8 2.1 2.1 3.8-4.2"/>',
	),
	hardware: meta(
		'#f97316',
		'<rect x="6.5" y="6.5" width="11" height="11" rx="1"/><path d="M10 2.8v3.7M14 2.8v3.7M10 17.5v3.7M14 17.5v3.7M2.8 10h3.7M2.8 14h3.7M17.5 10h3.7M17.5 14h3.7"/>',
		'<rect x="9.8" y="9.8" width="4.4" height="4.4"/>',
	),
	acg: meta(
		'#ec4899',
		'<path d="M7.2 7h9.6c2.6 0 4.2 2.1 4.2 4.7 0 2.7-1.3 5.3-3.2 5.3-1.4 0-2.3-1.1-3.1-2.3H9.3c-.8 1.2-1.7 2.3-3.1 2.3-1.9 0-3.2-2.6-3.2-5.3C3 9.1 4.6 7 7.2 7z"/>',
		'<path d="M7.6 10.4v3.2M6 12h3.2M15.4 11h.01M17.8 13h.01"/>',
	),
	blog: meta(
		'#00a8d8',
		'<path d="M4.6 19.4l.9-3.7L15.9 5.3a2 2 0 0 1 2.8 2.8L8.3 18.5z"/><path d="m14.2 7 2.8 2.8"/>',
	),
	work: meta(
		'#9aa7b0',
		'<rect x="3.5" y="7.5" width="17" height="11.5" rx="1.2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>',
		'<path d="M3.5 12.5h17"/>',
	),
	life: meta(
		'#a05a2c',
		'<path d="M5 9h11v6.5A4.5 4.5 0 0 1 11.5 20h-2A4.5 4.5 0 0 1 5 15.5z"/><path d="M16 10h1.6a2.7 2.7 0 0 1 0 5.4H16"/>',
		'<path d="M8.5 6c0-1.1.9-1.4.9-2.5M12 6c0-1.1.9-1.4.9-2.5"/>',
	),
	shitpost: meta(
		'#ffd60a',
		'<circle cx="12" cy="12" r="8.6"/>',
		'<path d="M8.3 13.6a4.4 4.4 0 0 0 7.4 0M9 9.4h.01M15 9.4h.01"/>',
	),
	essay: meta(
		'#c9d1d9',
		'<path d="M19.8 4.2c-6.3.3-10.8 4.1-12.8 9.7L4.2 19.8l5.9-2.7c5.6-2 9.4-6.6 9.7-12.9z"/><path d="M6.8 17.2 15.6 8.4"/>',
	),
	astro: meta(
		'#ff5d01',
		'<path d="M12 2.8c3 2.1 4.9 5.9 4.9 9.5l-2.2 2.9h-5.4l-2.2-2.9c0-3.6 1.9-7.4 4.9-9.5z"/><path d="M9.3 15.2 8.3 20l3.7-1.9L15.7 20l-1-4.8"/>',
		'<circle cx="12" cy="9.8" r="1.5"/>',
	),
	meta: meta(
		'#8f9ba4',
		'<circle cx="12" cy="12" r="8.8"/>',
		'<path d="M12 11v4.6M12 7.6h.01"/>',
	),
};

/** fallback for slugs outside the known taxonomy */
export const DEFAULT_CATEGORY_META: CategoryMeta = meta(
	'#8f9ba4',
	'<path d="M4 4h6.6l9.4 9.4-6.6 6.6L4 10.6z"/>',
	'<path d="M8.4 8.4h.01"/>',
);

export function categoryMeta(slug: string): CategoryMeta {
	return CATEGORY_META[slug] ?? DEFAULT_CATEGORY_META;
}
