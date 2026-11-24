<script lang="ts">
  import { decodeConfig } from './core/codec'
  import Editor from './editor/Editor.svelte'
  import Player from './player/Player.svelte'

  type Route = { name: 'edit'; data: string } | { name: 'play'; data: string }

  function parse(): Route {
    const h = location.hash.replace(/^#\/?/, '')
    if (h.startsWith('r/')) return { name: 'play', data: h.slice(2) }
    if (h.startsWith('edit')) return { name: 'edit', data: h.slice(4).replace(/^\//, '') }
    return { name: 'edit', data: '' }
  }

  let route = $state<Route>(parse())
  $effect(() => {
    const on = () => (route = parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  })

  const decoded = $derived(route.name === 'play' ? decodeConfig(route.data) : null)
</script>

{#if route.name === 'edit'}
  {#key route.data}
    <Editor initial={route.data} />
  {/key}
{:else if decoded?.ok}
  <main class="play">
    {#key route.data}
      <Player config={decoded.config} />
    {/key}
  </main>
{:else}
  <main class="play bad">
    <p>
      {decoded?.ok === false && decoded.reason === 'newer'
        ? 'このURLは新しい版で作られています。送ってくれた人に、もう一度送ってもらってください。'
        : 'このURLは開けませんでした。送ってくれた人に、もう一度URLを送ってもらってください。'}
    </p>
    <a class="make" href="#/edit">作る画面へ</a>
  </main>
{/if}

<style>
  .play {
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f1e8d6;
  }
  .bad {
    flex-direction: column;
    gap: 8px;
  }
  .make {
    color: #6a5648;
    font-weight: 700;
    padding: 12px 20px;
    min-height: 44px;
    box-sizing: border-box;
  }
  .bad p {
    max-width: 22em;
    padding: 0 24px;
    line-height: 1.8;
    color: #6a5648;
    text-align: center;
  }
</style>
