<script setup lang="ts">
import { ref } from 'vue';
import { circleOfFifths } from '../utils/notation-rules';
const props = defineProps<{ userKey: string }>();
const emit = defineEmits<{ 'key-change': [key: string]; start: [] }>();
const error = ref('');
function start() {
  if (!Object.hasOwn(circleOfFifths, props.userKey)) {
    error.value = 'Enter a supported key, such as C, D, Bb or C#.';
    return;
  }
  error.value = '';
  emit('start');
}
</script>

<template>
  <section>
    <div class="jumbotron">
      <div class="row">
        <div class="col-lg-6">
          <h2>Start converting notes to tab</h2>
          <p class="lead">Plot notation manually to get a starting point for playable guitar tab.</p>
          <h3>How to use</h3>
          <ul>
            <li>Choose a key, using the circle of fifths if helpful.</li>
            <li>Enter it below (D, Bb, C# etc.). C is the default.</li>
            <li>Select <strong>Next Step</strong> to plot your notes on the interactive music stave.</li>
          </ul>
          <form @submit.prevent="start">
            <label for="userKeyInput">Musical key</label>
            <div class="input-group mb-3">
              <input id="userKeyInput" class="form-control" :value="userKey" placeholder="C by default"
                :aria-invalid="Boolean(error)" :aria-describedby="error ? 'key-error' : undefined"
                @input="emit('key-change', ($event.target as HTMLInputElement).value)" />
              <button id="continueToBarViewBtn" class="btn btn-outline-primary" type="submit">Next Step</button>
            </div>
            <p v-if="error" id="key-error" role="alert">{{ error }}</p>
          </form>
          <h3>Device requirements</h3>
          <p>Use a laptop or desktop with a mouse or trackpad to plot notes. The stave has no keyboard editing controls.</p>
        </div>
        <div class="col-lg-6">
          <img class="img-fluid p-2" src="/circle-of-fifths.jpg" width="1024" height="1024" alt="Circle of fifths showing musical key signatures" />
        </div>
      </div>
    </div>
    <h2>Common gotchas</h2>
    <div class="row marketing">
      <div class="col-lg-6">
        <p>Apply each out-of-key accidental separately. Previously plotted accidentals do not change later notes automatically.</p>
        <p>4/4 is the only time signature currently supported.</p>
        <p>Tightly voiced triads and chords may need manual adjustment.</p>
      </div>
      <div class="col-lg-6">
        <p>Triplet grouping, beams, dotted values and note-tail styling are not configurable.</p>
        <p>The grid snaps notes to beat lines. Keep the original score to check rhythm and rests.</p>
      </div>
    </div>
  </section>
</template>
