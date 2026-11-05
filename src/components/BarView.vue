<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { staves, mutateNotesToActiveKey, assignTabValues, groupByPosition, groupByString, buildAsciTable } from '../utils/notation-rules';
import { drawNotes, drawStaves, linepointNearestMouse } from '../utils/canvas';
import { trackEvent } from '../utils/analytics';
import type { Accidental, ConversionNote, SavedBars, SavedNote, UserData } from '../types';

const props = defineProps<{ userData: UserData }>();
const emit = defineEmits<{ update: [data: Partial<UserData>]; reset: [] }>();
const canvas = ref<HTMLCanvasElement>();
const canvasHeight = 440;
const canvasWidth = 640;
const barWidthPadding = canvasWidth / 16;
const maxAmountNoteValue = 64;
const baseNoteSize = 18;
const savedNotesArr = ref<SavedBars>(JSON.parse(JSON.stringify(props.userData.savedNotesArr || {})) as SavedBars);
const activeBarNumber = ref(props.userData.activeBarNumber || 1);
const activeNoteLength = ref(16);
const accidentalOverride = ref<Accidental>(false);
const lowerBoundValue = ref(0);
const upperBoundValue = ref(12);
const mergedBars = ref<string[][] | null>(null);
const error = ref('');
let started = false;
let lastCompletedInput: string | null = null;
let preview: SavedNote | undefined;
const noteDenoms = [64, 32, 16, 8, 4, 2, 1];
const beatLineCords = computed(() => Array.from({ length: maxAmountNoteValue / activeNoteLength.value }, (_, i) =>
  (canvasWidth / (maxAmountNoteValue / activeNoteLength.value)) * i + barWidthPadding));

function persist() {
  emit('update', { savedNotesArr: savedNotesArr.value, activeBarNumber: activeBarNumber.value });
}
function draw(note?: SavedNote) {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawStaves(ctx);
  drawNotes(savedNotesArr.value[activeBarNumber.value] || [], ctx, maxAmountNoteValue);
  if (note) drawNotes([note], ctx, maxAmountNoteValue);
}
function noteAt(event: MouseEvent): SavedNote {
  const { offsetX, offsetY } = event;
  const closestStave = staves.map.reduce((prev, curr) =>
    Math.abs(offsetY - (curr.y0 - staves.snapTolerance)) < Math.abs(offsetY - (prev.y0 - staves.snapTolerance)) ? curr : prev);
  const closestBeatX = beatLineCords.value.reduce((prev, curr) =>
    Math.abs(curr - (offsetX - 25)) < Math.abs(prev - (offsetX - 25)) ? curr : prev);
  return {
    closestBeatX,
    lineY: linepointNearestMouse(closestStave, offsetX, offsetY).y,
    baseNoteSize,
    activeNoteLength: activeNoteLength.value,
    closestStave,
    accidentalOverride: accidentalOverride.value,
  };
}
function handleMouseMove(event: MouseEvent) {
  preview = noteAt(event);
  draw(preview);
}
function saveNote(event: MouseEvent) {
  // Commit on click, rather than waiting for an unrelated subsequent mousemove.
  const note = noteAt(event);
  const notes = savedNotesArr.value[activeBarNumber.value] || [];
  notes.push(note);
  savedNotesArr.value[activeBarNumber.value] = notes;
  persist();
  if (!started) {
    trackEvent('converter_started');
    started = true;
  }
  draw();
}
function changeBar(direction: number) {
  activeBarNumber.value = Math.max(1, activeBarNumber.value + direction);
  persist();
  preview = undefined;
  draw();
}
function clearBar() {
  savedNotesArr.value[activeBarNumber.value] = [];
  persist();
  mergedBars.value = null;
  draw();
}
function assignAccidental(type: Exclude<Accidental, false>) {
  accidentalOverride.value = accidentalOverride.value === type ? false : type;
}
function buildTable() {
  error.value = '';
  if (!Number.isInteger(lowerBoundValue.value) || !Number.isInteger(upperBoundValue.value)
    || lowerBoundValue.value < 0 || upperBoundValue.value < lowerBoundValue.value) {
    error.value = 'Enter whole-number fret limits with a minimum of zero and a maximum at least as high as the minimum.';
    return;
  }
  const hasNotes = Object.values(savedNotesArr.value).some(notes => notes.length > 0);
  if (!hasNotes) {
    error.value = 'Plot at least one note before generating tab.';
    mergedBars.value = null;
    return;
  }
  const result: string[][] = [];
  let failed = false;
  for (const notes of Object.values(savedNotesArr.value)) {
    const schema: ConversionNote[] = notes.map(note => ({
      accidentalOverride: note.accidentalOverride,
      activeNoteLength: note.activeNoteLength,
      pitch: note.closestStave.note,
      closestBeatX: note.closestBeatX,
      lowerBoundValue: lowerBoundValue.value,
      upperBoundValue: upperBoundValue.value,
    }));
    try {
      result.push(buildAsciTable(groupByString(groupByPosition(assignTabValues(mutateNotesToActiveKey(schema, props.userData.userKey))))));
    } catch (cause) {
      failed = true;
      error.value = cause instanceof Error ? cause.message : 'Unable to generate tab. Check your notes and fret limits.';
    }
  }
  mergedBars.value = result;
  persist();
  const input = JSON.stringify([savedNotesArr.value, props.userData.userKey, lowerBoundValue.value, upperBoundValue.value]);
  if (!failed && result.length && input !== lastCompletedInput) {
    trackEvent('conversion_completed');
    lastCompletedInput = input;
  }
}
watch(activeNoteLength, () => { preview = undefined; draw(); });
onMounted(() => { draw(); });
</script>

<template>
  <section class="App-content" aria-labelledby="stave-heading">
    <h2 id="stave-heading">Plot notes and generate guitar tab</h2>
    <p id="stave-help">Use a mouse or trackpad to place notes on the stave. On a small screen, scroll the stave horizontally.</p>
    <p>Bar {{ activeBarNumber }}</p>
    <div class="canvas-container">
      <button id="decrement-bar" class="btn btn-secondary" type="button" :disabled="activeBarNumber === 1" @click="changeBar(-1)">Previous</button>
      <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" aria-label="Music stave" aria-describedby="stave-help"
        @mousemove.prevent="handleMouseMove" @mouseleave="preview = undefined; draw()" @click="saveNote">
        The interactive stave requires a mouse or trackpad. Read the sheet music guide for manual conversion instructions.
      </canvas>
      <button id="increment-bar" class="btn btn-primary" type="button" @click="changeBar(1)">Next</button>
    </div>
    <div class="toggle-controls-container input-group w-auto">
      <label for="fret-min" class="input-group-text">Fret # min:</label>
      <input id="fret-min" v-model.number="lowerBoundValue" type="number" min="0" step="1" />
      <label for="fret-max" class="input-group-text">Fret # max:</label>
      <input id="fret-max" v-model.number="upperBoundValue" type="number" min="0" step="1" />
    </div>
    <div id="denom-buttons" class="toggle-controls-container" role="group" aria-label="Note duration and accidentals">
      <span>Notes:</span>
      <button v-for="item in noteDenoms" :key="item" class="btn btn-secondary time-grid-toggle-btn" type="button"
        :style="{ border: `1px solid ${activeNoteLength === item ? 'red' : 'white'}` }"
        :aria-pressed="activeNoteLength === item" :aria-label="`Note duration 1/${maxAmountNoteValue / item}`"
        @click="activeNoteLength = item">{{ `1/${maxAmountNoteValue / item}` }}</button>
      <button class="btn btn-secondary" type="button" aria-label="Natural" :aria-pressed="accidentalOverride === 'natural'"
        :style="{ border: `1px solid ${accidentalOverride === 'natural' ? 'red' : 'white'}` }" @click="assignAccidental('natural')">♮</button>
      <button id="add-flat-btn" class="btn btn-secondary" type="button" aria-label="Flat" :aria-pressed="accidentalOverride === 'flat'"
        :style="{ border: `1px solid ${accidentalOverride === 'flat' ? 'red' : 'white'}` }" @click="assignAccidental('flat')">♭</button>
      <button id="add-sharp-btn" class="btn btn-secondary" type="button" aria-label="Sharp" :aria-pressed="accidentalOverride === 'sharp'"
        :style="{ border: `1px solid ${accidentalOverride === 'sharp' ? 'red' : 'white'}` }" @click="assignAccidental('sharp')">#</button>
    </div>
    <div class="toggle-controls-container">
      <button class="btn btn-warning" type="button" @click="clearBar">Clear bar</button>
      <button id="reset-app-btn" class="btn btn-danger" type="button" @click="emit('reset')">Reset</button>
      <button id="build-table-btn" class="btn btn-success" type="button" @click="buildTable">Generate tab below</button>
    </div>
    <p v-if="error" role="alert" class="conversion-error">{{ error }}</p>
  </section>
  <section v-if="mergedBars && mergedBars.length" id="tab-table" class="App-content code" aria-label="Generated guitar tablature" aria-live="polite">
    <template v-for="(bars, barIndex) in mergedBars" :key="barIndex">
      <span v-for="(bar, stringIndex) in bars" :key="stringIndex">{{ bar }}</span><br />
    </template>
  </section>
</template>
