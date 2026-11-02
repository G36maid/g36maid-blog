// site-wide constants — edit here to rebrand every page
export const SITE_TITLE = 'G36MAID // WIRED ARCHIVE';
export const SITE_DESCRIPTION =
	'g36maid 的技術檔案室 — Linux 開源工具、自架伺服器（homelab）、程式開發與技術隨筆，收藏於 Wired 深層。';
export const SITE_URL = 'https://blog.g36maid.dev';

/** nav items — one source rendered by components/Tabs.astro and the footer */
export const NAV_ITEMS = [
	{ href: '/', label: '首頁' },
	{ href: '/blog/', label: '文章' },
	{ href: '/notes/', label: '筆記' },
	{ href: '/categories/', label: '分類' },
	{ href: '/tags/', label: '標籤' },
	{ href: '/friends/', label: '友站' },
	{ href: '/about/', label: '關於' },
] as const;
