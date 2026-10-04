import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts } from '../lib/content';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context: APIContext) {
	const posts = await getSortedPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site!,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: [post.data.category, ...post.data.tags],
			link: `/blog/${post.id}/`,
		})),
		customData: '<language>zh-Hant</language>',
	});
}
