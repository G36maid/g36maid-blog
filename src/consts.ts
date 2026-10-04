// site-wide constants — edit here to rebrand every page
export const SITE_TITLE = 'G36MAID // WIRED ARCHIVE';
export const SITE_DESCRIPTION =
	'g36maid 的技術檔案室 — Astro / Linux / 自架服務筆記，收藏於 Wired 深層。Serial experiments Lain × 虹彩六號戰術 UI × 少女前線 G36。';
export const SITE_AUTHOR = 'g36maid';
export const SITE_URL = 'https://blog.g36maid.dev';

/** posts per page on the homepage "LATEST LOGS" feed */
export const LATEST_POSTS_COUNT = 6;

/** nav items — uppercase tactical style */
export const NAV_ITEMS = [
	{ href: '/', label: 'HOME', code: '00' },
	{ href: '/blog/', label: 'LOGS', code: '01' },
	{ href: '/notes/', label: 'NOTES', code: '02' },
	{ href: '/tags/', label: 'TAGS', code: '03' },
	{ href: '/about/', label: 'ABOUT', code: '04' },
] as const;

/** lain easter eggs */
export const LAIN_SLOGAN = 'Close the world, Open the nExt';
