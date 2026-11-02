/**
 * UI icon set — vendored 24×24 SVGs in src/assets/icons/, downloaded from
 * api.iconify.design (Pictogrammers Material Design Icons, Apache-2.0).
 * One file per role: rss/person/search are shared by the site header and
 * the home menu topbar so no icon drawing exists in two places.
 */
const FILES = import.meta.glob<string>('/src/assets/icons/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true,
});

export function icon(name: string): string {
	const raw = FILES[`/src/assets/icons/${name}.svg`];
	if (!raw) throw new Error(`unknown icon: ${name}`);
	return raw;
}
