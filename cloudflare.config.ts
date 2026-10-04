import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "blog",
		compatibilityDate: "2026-10-04",
		assets: {
			htmlHandling: "auto-trailing-slash",
			notFoundHandling: "404-page",
		},
		domains: [
			"blog.g36maid.dev",
		],
	},
});
