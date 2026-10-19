// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import { defineConfig, fontProviders } from 'astro/config';

import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import remarkMath from 'remark-math';
import remarkGithubAlerts from 'remark-github-blockquote-alert';
import rehypeKatex from 'rehype-katex';

import rehypeMmdr from './src/plugins/rehype-mmdr';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.g36maid.dev',
	integrations: [
		expressiveCode({
			themes: ['tokyo-night'],
			useDarkModeMediaQuery: false, // site is dark-only (Lain CRT aesthetic)
			styleOverrides: {
				borderRadius: '0',
				borderColor: 'var(--border)',
				codeFontFamily: "'Courier Prime', ui-monospace, monospace",
				fontSize: '0.875rem',
				frames: {
					editorActiveTabIndicatorBottomBorderColor: 'var(--accent-gold)',
					editorTabBarBorderColor: 'var(--border)',
					editorTabBarBackground: '#0a0d13',
					editorActiveTabBackground: '#11151f',
					editorActiveTabTextColor: 'var(--accent-gold)',
					editorBackground: '#0a0d13',
					terminalTitlebarBackground: '#0a0d13',
					terminalTitlebarTextColor: 'var(--text-dim)',
					terminalBackground: '#0a0d13',
				},
			},
		}),
		mdx(),
		sitemap(),
	],
	markdown: {
		// Astro 7 defaults to the native Sätteri processor, which cannot run JS
		// remark/rehype plugins. Switch to the unified() processor for the full
		// GitHub-parity plugin chain (see proposal 0061).
		processor: unified({
			remarkPlugins: [
				remarkGfm, // tables, task lists, strikethrough, footnotes, autolinks
				remarkEmoji, // :tada: → 🎉 (emoticons too)
				[remarkMath, { singleDollarTextMath: false }], // $$…$$ + ```math only (CJK-safe)
				remarkGithubAlerts, // > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
			],
			rehypePlugins: [
				rehypeHeadingIds, // must run first: heading ids for TOC scrollspy
				rehypeKatex, // math nodes → KaTeX HTML
				[rehypeMmdr, { configFile: new URL('./mermaid-dark.json', import.meta.url).pathname }], // mermaid → static SVG via pure-Rust mmdr
			],
		}),
		// keep mermaid & math fences away from Shiki/Expressive Code
		syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Bebas Neue',
			cssVariable: '--font-display',
			weights: [400],
			fallbacks: ['Oswald', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Oswald',
			cssVariable: '--font-narrow',
			weights: [300, 500],
			fallbacks: ['Arial Narrow', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Barlow',
			cssVariable: '--font-body',
			weights: [400, 600, 700],
			styles: ['normal', 'italic'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Special Elite',
			cssVariable: '--font-typewriter',
			weights: [400],
			fallbacks: ['Courier New', 'monospace'],
		},
		{
			provider: fontProviders.google(),
			name: 'VT323',
			cssVariable: '--font-terminal',
			weights: [400],
			fallbacks: ['monospace'],
		},
		{
			provider: fontProviders.google(),
			name: 'Barlow Condensed',
			cssVariable: '--font-cond',
			weights: [500, 600, 700],
			fallbacks: ['Oswald', 'Arial Narrow', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'IBM Plex Mono',
			cssVariable: '--font-plexmono',
			weights: [400, 500],
			fallbacks: ['ui-monospace', 'monospace'],
		},
		{
			provider: fontProviders.google(),
			name: 'Courier Prime',
			cssVariable: '--font-code',
			weights: [400, 700],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
