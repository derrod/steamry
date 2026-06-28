import type { RequestHandler } from '@sveltejs/kit';
import * as sitemap from 'super-sitemap';

export const prerender = true;

export const GET: RequestHandler = async () => {
  return await sitemap.response({
    origin: process.env.ORIGIN || 'https://steamry.pages.dev',
    excludeRoutePatterns: ['^/play*', '^/replay*'],
  });
};
