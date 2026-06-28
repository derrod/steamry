<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { MIN_REVIEWS } from '$lib';
  import logoImage from '$lib/assets/logo.png';
  import Button from '$lib/components/ui/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import Container from '$lib/components/ui/container.svelte';
  import Link from '$lib/components/ui/link.svelte';

  const DESCRIPTION = 'A daily Steam review ratio guessing game';
  const PUBLIC_ORIGIN = env.PUBLIC_ORIGIN || 'https://steamry.rodney.io';
  const OG_IMAGE = `${PUBLIC_ORIGIN}/og-image.png`;
</script>

<svelte:head>
  <title>Steamry - {DESCRIPTION}</title>

  <meta property="og:type" content="website" />
  <meta property="og:url" content="{PUBLIC_ORIGIN}/" />
  <meta property="og:title" content="Steamry" />
  <meta property="og:description" content={DESCRIPTION} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:logo" content="{PUBLIC_ORIGIN}/logo.png" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="{PUBLIC_ORIGIN}/" />
  <meta name="twitter:title" content="Steamry" />
  <meta name="twitter:description" content={DESCRIPTION} />
  <meta name="twitter:image" content={OG_IMAGE} />
</svelte:head>

<Container>
  <Card>
    <h1 class="flex items-center justify-center gap-4 text-6xl font-bold text-white uppercase">
      <img src={logoImage} alt="Steamry logo" width="56" height="56" />Steamry
    </h1>
    <h2 class="mt-2 text-center text-card-foreground md:text-2xl">
      A daily Steam review ratio guessing game
    </h2>
    <p class="mt-6">
      Try to guess which game has a <span class="font-semibold text-primary-foreground"
        >higher percentage of positive reviews</span
      >.
    </p>
    <p class="mt-2">
      Any game can appear, <span class="font-semibold">with the exception of:</span>
    </p>
    <ul class="list-inside list-disc">
      <li>Games with less than {MIN_REVIEWS} reviews</li>
      <li>
        Games marked as having "Frequent Nudity or Sexual Content" or with adult content related
        tags in their top 5 tags
      </li>
      <li>And also games that had issues with fetching info about them</li>
    </ul>
    <p class="mt-2">
      <span class="font-semibold">All reviews are considered:</span> all time, all languages,
      including "received for free" and
      <Link href="https://partner.steamgames.com/doc/store/reviews#ReviewBombing">"off-topic"</Link
      >.
    </p>
    <div class="mt-6 text-center">
      <Button href="/play" variant="accent" size="lg">Play</Button>
    </div>
    <div class="mt-4 text-center">
      <Button href="/replay" size="sm">Play previous dailies</Button>
    </div>
    <details
      class="mt-6 overflow-hidden border border-mute-foreground/35 bg-card-background-2/45 text-left"
    >
      <summary
        class="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold text-card-foreground transition-colors select-none hover:bg-mute-background/40"
      >
        <span>Changelog</span>
        <span class="text-xs text-mute-foreground">Click to expand</span>
      </summary>
      <div class="border-t border-mute-foreground/20 bg-card-background-2/20 px-4 py-3">
        <div>
          <h3 class="mb-2 text-sm font-bold text-primary-foreground">June 28, 2026</h3>
          <ul class="list-inside list-disc space-y-1.5 pl-1 text-sm text-foreground/90">
            <li>
              Moved app to Cloudflare Workers + Turso to simplify hosting and hopefully survive on
              the free tier :P
            </li>
            <li>
              Filtered out games based on user tags, but only consider the top 5 ones as they are
              quite unreliable (e.g. Blender is tagged "Hentai", but it's quite low down.)
            </li>
            <li>Removed analytics</li>
            <li>Added this changelog, lol</li>
          </ul>
        </div>
      </div>
    </details>
    <p class="mt-6">
      Inspired by <Link href="https://scrandle.com/">Scrandle</Link>. Not affiliated with Valve
      Corporation.
    </p>
    <p>
      Made by <Link href="https://bsky.app/profile/teatov.xyz">Teatov</Link>, updated and now hosted
      by <Link href="https://bsky.app/profile/rodney.io">Rodney</Link>. Source code is available on
      <Link href="https://github.com/derrod/steamry">GitHub</Link>. Thanks.
    </p>
  </Card>
</Container>
