<script setup>
import { computed, onMounted, ref } from 'vue'

const sampleText = 'Furthermore, our team developed a thoughtful approach to the project. We reviewed the evidence, compared several alternatives, and documented the results. I love how the bright ideas came together; the final plan feels clear, helpful, and surprisingly vivid!'
const text = ref(sampleText)
const message = ref('')
const writeLikeMe = ref(null)
const profile = computed(() => writeLikeMe.value?.analyzeText(text.value) || null)
const svg = computed(() => profile.value ? writeLikeMe.value.generateStyleSVG(profile.value) : '')
const code = computed(() => `const WriteLikeMe = require('@ai-clyde/writelikeme');\n\nconst profile = ${JSON.stringify(profile.value, null, 2)};\nconst svg = WriteLikeMe.generateStyleSVG(profile);\n`)
const categories = [
  ['formality', 'Formality'],
  ['complexity', 'Complexity'],
  ['sentence_length', 'Sentence length'],
  ['vocabulary', 'Vocabulary variety'],
  ['tone', 'Positive tone'],
  ['creativity', 'Creativity signals']
]

onMounted(async () => {
  try {
    writeLikeMe.value = await loadAnalyzer()
  } catch (error) {
    message.value = `The analyzer failed to load: ${error instanceof Error ? error.message : String(error)}`
  }
})

function loadAnalyzer() {
  if (window.WriteLikeMe) {
    return Promise.resolve(window.WriteLikeMe)
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.BASE_URL}writelikeme.js`
    script.onload = () => {
      if (window.WriteLikeMe) {
        resolve(window.WriteLikeMe)
      } else {
        reject(new Error('The browser script loaded without exposing the API.'))
      }
    }
    script.onerror = () => reject(new Error(`Could not load ${script.src}`))
    document.head.append(script)
  })
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value)
    message.value = 'JavaScript copied.'
  } catch (error) {
    message.value = `Could not copy code: ${error instanceof Error ? error.message : String(error)}`
  }
}

function downloadSvg() {
  const blob = new Blob([svg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'writelikeme-code.svg'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  message.value = 'SVG downloaded.'
}
</script>

<template>
  <section class="style-demo" aria-labelledby="demo-title">
    <div class="demo-intro">
      <h2 id="demo-title">Try it with your own text</h2>
      <p>Text stays in your browser. See the estimated profile, then copy the JavaScript or download your QR-inspired style code.</p>
    </div>

    <template v-if="writeLikeMe && profile">
      <label class="demo-label" for="sample-text">Sample text</label>
      <textarea id="sample-text" v-model="text" rows="6" spellcheck="true"></textarea>

      <div class="demo-layout">
      <div class="score-panel">
        <h3>Style profile</h3>
        <p class="count-summary">{{ profile.wordCount }} words · {{ profile.charCount }} characters</p>
        <ul class="score-list">
          <li v-for="[key, label] in categories" :key="key">
            <div class="score-heading">
              <span>{{ label }}</span>
              <strong>{{ Math.round(profile[key] * 100) }}%</strong>
            </div>
            <div class="score-track" aria-hidden="true">
              <span :style="{ width: `${profile[key] * 100}%` }"></span>
            </div>
          </li>
        </ul>
        <p class="confidence">Signal strength: {{ Math.round(profile.confidence * 100) }}% (based on text length)</p>
      </div>

      <div class="preview-panel">
        <h3>WriteLikeMe Code</h3>
        <div class="svg-preview" role="img" aria-label="QR-inspired circular code generated from the writing style profile" v-html="svg"></div>
        <div class="demo-actions">
          <button type="button" class="demo-primary" @click="downloadSvg">Download SVG</button>
          <button type="button" @click="copyCode">Copy JavaScript</button>
        </div>
      </div>
      </div>

      <details class="generated-code">
      <summary>View generated JavaScript</summary>
      <pre><code>{{ code }}</code></pre>
      </details>
    </template>
    <p v-else-if="!message" class="demo-loading">Preparing the browser analyzer…</p>
    <p class="demo-message" role="status" aria-live="polite">{{ message }}</p>
    <p class="demo-disclaimer">These are lightweight dictionary and text-shape heuristics, not an AI assessment. Results can be inaccurate, especially for short text or languages other than English.</p>
  </section>
</template>

<style scoped>
.style-demo {
  margin: 42px 0 54px;
  padding: 24px;
  border: 1px solid #28374c;
  border-radius: 12px;
  background: #0b1220;
}

.demo-intro h2,
.score-panel h3,
.preview-panel h3 {
  margin: 0 0 8px;
  color: #edf2f7;
}

.demo-intro p,
.count-summary,
.confidence,
.demo-disclaimer {
  color: #a9b6c8;
  line-height: 1.6;
}

.demo-label {
  display: block;
  margin: 22px 0 8px;
  color: #edf2f7;
  font-weight: 650;
}

textarea {
  display: block;
  width: 100%;
  min-height: 150px;
  resize: vertical;
  padding: 14px;
  border: 1px solid #28374c;
  border-radius: 8px;
  background: #101827;
  color: #edf2f7;
  font: inherit;
  line-height: 1.6;
}

textarea:focus-visible,
button:focus-visible,
summary:focus-visible {
  outline: 2px solid #73e0bd;
  outline-offset: 2px;
}

.demo-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  margin-top: 20px;
}

.score-panel,
.preview-panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid #28374c;
  border-radius: 10px;
  background: #131f30;
}

.count-summary,
.confidence {
  margin: 0;
  font-size: 0.85rem;
}

.score-list {
  display: grid;
  gap: 13px;
  margin: 18px 0;
  padding: 0;
  list-style: none;
}

.score-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  color: #d9e5f2;
  font-size: 0.9rem;
}

.score-heading strong {
  color: #73e0bd;
  font-variant-numeric: tabular-nums;
}

.score-track {
  height: 7px;
  overflow: hidden;
  border-radius: 9px;
  background: #0b1220;
}

.score-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #73e0bd;
  transition: width 120ms ease-out;
}

.svg-preview {
  display: grid;
  min-height: 240px;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: #080e19;
}

.svg-preview :deep(svg) {
  display: block;
  width: min(100%, 320px);
  height: auto;
}

.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

button {
  padding: 10px 14px;
  border: 1px solid #34445c;
  border-radius: 8px;
  background: transparent;
  color: #edf2f7;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

button:hover {
  border-color: #73e0bd;
}

button.demo-primary {
  border-color: #73e0bd;
  background: #73e0bd;
  color: #10231f;
}

.generated-code {
  margin-top: 18px;
  border: 1px solid #28374c;
  border-radius: 8px;
  color: #d9e5f2;
}

.generated-code summary {
  padding: 12px 14px;
  cursor: pointer;
}

.generated-code pre {
  overflow-x: auto;
  margin: 0;
  padding: 14px;
  border-top: 1px solid #28374c;
  color: #d9e5f2;
  font: 0.85rem/1.65 ui-monospace, SFMono-Regular, Consolas, monospace;
}

.demo-message {
  min-height: 1.5em;
  color: #73e0bd;
}

.demo-disclaimer {
  margin-bottom: 0;
  font-size: 0.85rem;
}

@media (max-width: 700px) {
  .style-demo {
    padding: 16px;
  }

  .demo-layout {
    grid-template-columns: 1fr;
  }
}
</style>
