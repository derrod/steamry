import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getTodayDate, getTomorrowDate, type ResultBody } from '$lib';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );

  const hashArray = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < hashArray.byteLength; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (request.headers.get('origin') !== env.ORIGIN) {
    throw error(403);
  }

  const data = await request.json();
  if (!isResult(data)) {
    throw error(400);
  }

  const date = new Date(data.date);
  const todayDate = getTodayDate();

  if (
    !(
      date.getTime() === todayDate.getTime() ||
      date.getTime() === getTomorrowDate(todayDate).getTime() ||
      date.getTime() === getTomorrowDate(todayDate, -1).getTime()
    )
  ) {
    throw error(400);
  }

  const daily = await db.query.dailies.findFirst({
    where: eq(schema.dailies.date, date),
    with: { games: true },
  });

  if (!daily || !daily.games || daily.games.length === 0) {
    throw error(500);
  }

  const rounds = Object.keys(
    daily.games.reduce(
      (acc: Record<number, true>, curr: any) => {
        acc[curr.round] = true;
        return acc;
      },
      {} as Record<number, true>,
    ),
  ).length;

  if (data.guesses.length !== rounds) {
    throw error(400);
  }

  const ipHashed = await hmacSha256(getClientAddress(), env.SECRET_KEY!);

  await db
    .insert(schema.results)
    .values({
      dailyId: daily.id,
      ipHashed,
      correctGuesses: data.guesses.filter((value) => value).length,
      guesses: data.guesses,
    })
    .onConflictDoNothing();

  return new Response(undefined, { status: 201 });
};

function isResult(data: unknown): data is ResultBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'date' in data &&
    typeof data.date === 'string' &&
    'guesses' in data &&
    typeof data.guesses === 'object' &&
    data.guesses !== null &&
    Array.isArray(data.guesses) &&
    data.guesses.every((value) => typeof value === 'boolean')
  );
}
