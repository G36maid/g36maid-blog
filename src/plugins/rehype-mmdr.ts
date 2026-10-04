/**
 * rehype-mmdr — build-time Mermaid rendering via the pure-Rust `mmdr` binary.
 *
 * No browser, no Playwright, no Chromium. mmdr (~3ms/diagram, native) renders
 * ```mermaid fences into static inline SVG during `astro build`.
 *
 * Strategy: replace every <pre><code class="language-mermaid"> block with a
 * <figure class="mermaid-figure"> wrapping the rendered SVG. If the binary is
 * missing or a diagram fails to parse, the original code block is kept and a
 * warning is logged — the build never breaks because of a diagram.
 *
 * Requires: `mmdr` on PATH (crates.io: mermaid-rs-renderer / AUR: mmdr-bin).
 * Astro config must exclude mermaid from syntax highlighting:
 *   syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] }
 */
import { execFileSync } from 'node:child_process';
import type { Element, Root, RootContent } from 'hast';
import { toText } from 'hast-util-to-text';
import { visit } from 'unist-util-visit';

export interface RehypeMmdrOptions {
	/** mmdr theme preset: default | dark | forest | neutral | modern */
	theme?: string;
	/** Path to a Mermaid-like themeVariables JSON config (overrides preset colors) */
	configFile?: string;
	/** mmdr binary name or absolute path */
	binary?: string;
	/** Class name for the wrapping <figure> */
	className?: string;
	/** Skip rendering (useful for debugging the pipeline) */
	enabled?: boolean;
}

const defaults = {
	theme: 'dark',
	binary: 'mmdr',
	className: 'mermaid-figure',
	enabled: true,
} satisfies Required<RehypeMmdrOptions>;

function renderSvg(source: string, opts: Required<RehypeMmdrOptions>): string | null {
	const args = ['-i', '-', '-t', opts.theme, '-e', 'svg'];
	if (opts.configFile) args.push('--configFile', opts.configFile);
	try {
		return execFileSync(opts.binary, args, {
			input: source,
			encoding: 'utf8',
			maxBuffer: 32 * 1024 * 1024,
			timeout: 30_000,
		});
	} catch (err) {
		const reason = err instanceof Error ? err.message.split('\n')[0] : String(err);
		console.warn(`[rehype-mmdr] render failed, keeping code block: ${reason}`);
		return null;
	}
}

export default function rehypeMmdr(options: RehypeMmdrOptions = {}) {
	const opts: Required<RehypeMmdrOptions> = { ...defaults, ...options };

	return (tree: Root) => {
		if (!opts.enabled) return;

		/** Pending <pre> replacements: parent node + index of the <pre> + svg */
		const pending: Array<{ parent: Root; index: number; svg: string }> = [];

		visit(tree, 'element', (node: Element, index, parent) => {
			if (node.tagName !== 'pre' || !parent || index === undefined) return;
			const code = node.children.find(
				(child): child is Element => child.type === 'element' && child.tagName === 'code',
			);
			if (!code) return;
			const classes = code.properties?.className;
			if (!Array.isArray(classes) || !classes.includes('language-mermaid')) return;

			const source = toText(code, { whitespace: 'pre' }).trim();
			if (!source) return;

			const svg = renderSvg(source, opts);
			if (svg) pending.push({ parent, index, svg });
		});

		for (const { parent, index, svg } of pending) {
			const figure: RootContent = {
				type: 'raw',
				value: `<figure class="${opts.className}" role="img">${svg}</figure>`,
			};
			parent.children[index] = figure;
		}
	};
}
