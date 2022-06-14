<script lang="ts">
import {set, ref, getDatabase, onValue} from "firebase/database"
import {onMount} from "svelte"
import {derived, readable, writable} from "svelte/store"
import {app} from "../firebaseConfig"

// Get a reference to the database service
const db = getDatabase(app)

export const firebase_set = <T>(path:string, value:T) => set(ref(db, path), value)

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

let player

// firebase_set("youtube", "gD8vI_t7CXA")

const s = derived([youtube$], ([youtube]) => {
  if (!youtube) return
  youtube = String(youtube).split("?v=").pop()
  // https://www.youtube.com/watch?v=WSEviSd3wQM

  if (!youtube) {
    if (player) player.stopVideo()
    return
  }

  if (player) {
    player.loadVideoById({"videoId": youtube})
    player.setVolume(3)
    player.playVideo()
    return
  }

  player = new YT.Player("ytplayer", {
    width: "400",
    height: "400",
    videoId: youtube,
    playerVars: {"autoplay": 1, "controls": 1},
    events: {
      onReady() {
        player.setVolume(3)
        player.playVideo()
      },
    }
  })
})

let started = false

const noop = () => {}

const play = () => {
  started = true
  s.subscribe(noop)
}

const enter = (e) => {
  if (e.key !== "Enter") return
  firebase_set("youtube", e.target.value.trim())
}
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
      <button on:click={play} class="c(#fff) font(100) bold">▶</button>
    {/if}
  </div>

  <div class="h(40)"/>
</div>

{#if started}
  <div class="layer(bottom) m(20) vbox gap(8)">
    <div class="c(#888) text-center">같이 듣고 싶은 유투브 주소를 입력해보세요.</div>
    <input value={$youtube$} class="bg(#000) c(#555) b(-) r(100) p(10/20) block w(100%) outline(none) text-center" spellcheck="false" on:keydown={enter}/>
  </div>
{/if}

<style global>
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