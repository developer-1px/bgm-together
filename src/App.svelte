<script lang="ts">
import {getDatabase, onDisconnect, onValue, ref, set} from "firebase/database"
import {derived, readable} from "svelte/store"
import {app} from "../firebaseConfig"

// Get a reference to the database service
const db = getDatabase(app)

export const firebase_set = <T>(path:string, value:T) => set(ref(db, path), value)

export const firebase_set_on_disconnect_remove = <T>(path:string, value:T) => {
  set(ref(db, path), value)
  onDisconnect(ref(db, path)).remove()
}

export const createFirebaseReadable = <T>(path:string, initValue:T) => readable<T>(initValue, set => {
  path = path.split("/").filter(Boolean).join("/")

  onValue(ref(db, path), (snap) => {
    if (snap.exists()) {
      const data = snap.val()
      set(data)
    }
    else {
      set(initValue)
    }
  })
})

const youtube$ = createFirebaseReadable("youtube", "")
const users$ = createFirebaseReadable("users", {})
const count = $derived(Object.values($users$ ?? {}).length)


function extractYoutubeVideoId(url) {
  if (!url) return null;

  // URL 객체 생성 시도
  let urlObj;
  try {
    urlObj = new URL(url.trim());
  } catch (e) {
    return null;
  }

  // 호스트네임 검사
  const validHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];
  const hostname = urlObj.hostname.toLowerCase();
  if (!validHosts.includes(hostname)) {
    return null;
  }

  // youtu.be 단축 URL 처리
  if (hostname === 'youtu.be') {
    const id = urlObj.pathname.split('/')[1];
    return id || null;
  }

  // 임베드 URL 처리
  if (urlObj.pathname.toLowerCase().includes('/embed/')) {
    const id = urlObj.pathname.split('/embed/')[1];
    return id || null;
  }

  // 일반 watch URL 처리
  if (urlObj.pathname.toLowerCase() === '/watch') {
    const videoParam = urlObj.searchParams.get('v');
    return videoParam || null;
  }

  // 짧은 URL 처리
  if (urlObj.pathname.toLowerCase().includes('/shorts/')) {
    const id = urlObj.pathname.split('/shorts/')[1];
    return id || null;
  }

  return null;
}

let started = $state(false)
const id = Math.random().toString(36).slice(2)

const handleBGMPlay = () => {
  started = true
  firebase_set_on_disconnect_remove(`/users/${id}`, id)
}

const handleYoutubeLinkEnter = (e) => {
  if (e.key !== "Enter") return
  firebase_set("youtube", e.target.value.trim())
}

let youtube = $derived($youtube$)
let player

$effect(() => {
  if (!youtube) return
  if (!started) return

  const youtubeVideoId = extractYoutubeVideoId(youtube)
  if (!youtubeVideoId) {
    if (player) player.stopVideo()
    return
  }

  if (player) {
    player.loadVideoById({"videoId": youtubeVideoId})
    player.setVolume(3)
    player.playVideo()
    return
  }

  player = new YT.Player("ytplayer", {
    width: "400",
    height: "400",
    videoId: youtubeVideoId,
    playerVars: {"autoplay": 1, "controls": 1},
    events: {
      onReady() {
        player.setVolume(3)
        player.playVideo()
      },
    }
  })
})

</script>

<div class="layer vpack gap(20)">
  <div class="hbox gap(3) h(20) hidden .started:visible" class:started>
    <div class="w(5) h(100%) bg(orange) bounce"></div>
    <div class="w(5) h(100%) bg(orange) bounce animation-delay(-2.2s)"></div>
    <div class="w(5) h(100%) bg(orange) bounce animation-delay(-3s)"></div>
  </div>

  <div class="w(400) h(400) bg(#000) b(5/#fff) r(20) pack">
    <div id="ytplayer"/>
    {#if !started}
      <button onclick={handleBGMPlay} class="c(#fff) font(100) bold">
        <div>▶</div>
        <div class="font(20) c(#555)">click</div>
      </button>
    {/if}
  </div>

  {#if count}
    <div class="c(#888) h(20)">지금 <span class="c(#fff)">{count}</span>명이
      {#if count > 1}함께{/if} 듣고 있어요. 🎶
    </div>
  {:else}
    <div class="c(#888) h(20)">지금은 아무도 듣지 않고 있네요. 무슨 음악일지 궁금하지 않아요?</div>
  {/if}

  <div class="h(40)"/>
</div>

{#if started}
  <div class="layer(bottom) m(20) vbox gap(8)">
    <div class="c(#888) text-center">같이 듣고 싶은 유투브 주소를 입력해보세요. 모든 사람들이 같은 BGM을 듣고 있어요.</div>
    <input value={$youtube$} class="bg(#000) c(#555) b(-) r(100) p(10/20) block w(100%) outline(none) text-center" spellcheck="false" onkeydown={handleYoutubeLinkEnter}/>
  </div>
{/if}

<div class="layer(bottom+right) m(10) c(#888) font(10)">0.0.2</div>

<style global>
:root { font-family:Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;}
html { background:#111}
#ytplayer {box-shadow:0 0 10px rgba(0, 0, 0, .5);}
.bounce { animation:bounce 2.2s ease infinite alternate; transform-origin:bottom; }

@keyframes bounce {
  10% {
    transform:scaleY(0.3); /* start by scaling to 30% */
  }

  30% {
    transform:scaleY(1); /* scale up to 100% */
  }

  60% {
    transform:scaleY(0.5); /* scale down to 50% */
  }

  80% {
    transform:scaleY(0.75); /* scale up to 75% */
  }

  100% {
    transform:scaleY(0.6); /* scale down to 60% */
  }
}
</style>