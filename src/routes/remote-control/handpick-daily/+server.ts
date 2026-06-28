import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { floorDate } from '$lib';
import handpickDaily from '$lib/server/daily/handpick-daily';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { key, date, rounds } = (await request.json()) as {
    key?: string;
    date?: string;
    rounds?: number[][];
  };
  if (!key || key !== env.REMOTE_CONTROL_KEY) {
    throw error(401);
  }
  if (!date || !rounds) {
    throw error(400, "Field 'date' or 'rounds' are missing");
  }

  await handpickDaily(floorDate(new Date(date)), rounds);

  return json({ message: `Successfully handpicked daily for ${new Date(date).toISOString()}...` });
};
