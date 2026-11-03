<script setup>
import { computed, onMounted, ref } from 'vue'

const sampleText = 'Furthermore, our team developed a thoughtful approach to the project. We reviewed the evidence, compared several alternatives, and documented the results. I love how the bright ideas came together; the final plan feels clear, helpful, and surprisingly vivid!'
const text = ref(sampleText)
const message = ref('')
const writeLikeMe = ref(null)
const imported = ref(null)
const importedName = ref('')
const prompt = ref('Write a short update about the project launch.')
const includeWords = ref(true)
const draft = ref('')
const fileInput = ref(null)

const profile = computed(() => {
  if (!writeLikeMe.value) return null
  return imported.value || writeLikeMe.value.createStyleProfile(writeLikeMe.value.analyzeText(text.value))
})
const svg = computed(() => profile.value ? writeLikeMe.value.generateStyleSVG(profile.value, undefined, undefined, { includeWords: includeWords.value }) : '')
const brief = computed(() => profile.value ? writeLikeMe.value.describeStyle(profile.value) : '')
const agentPrompt = computed(() => `Write in my personal style. Follow this style brief (from WriteLikeMe):\n\n${brief.value}\n\nKeep the meaning of my request; match the voice, not the topic.`)
const code = `// npm install @ai-clyde/writelikeme
const fs = require('fs');
const WriteLikeMe = require('@ai-clyde/writelikeme');

const sample = fs.readFileSync('my-writing.txt', 'utf8');
const analysis = WriteLikeMe.analyzeText(sample);
fs.writeFileSync('writelikeme-code.svg', WriteLikeMe.generateStyleSVG(analysis));
console.log(WriteLikeMe.describeStyle(analysis));
`
const categories = [
  ['formality', 'Formality'],
  ['complexity', 'Complexity'],
  ['sentence_length', 'Sentence length'],
  ['vocabulary', 'Vocabulary variety'],
  ['tone', 'Positive tone'],
  ['creativity', 'Creativity signals'],
  ['punctuation', 'Comma / period balance']
]

onMounted(async () => {
  try {
    writeLikeMe.value = await loadAnalyzer()
  } catch (error) {
    message.value = `The analyzer failed to load: ${errorText(error)}`
  }
})

function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

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

async function copy(value, label) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
    } else {
      const area = document.createElement('textarea')
      area.value = value
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.append(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      if (!ok) throw new Error('Clipboard is unavailable in this browser.')
    }
    message.value = `${label} copied.`
  } catch (error) {
    message.value = `Could not copy ${label.toLowerCase()}: ${errorText(error)}`
  }
}

function downloadSvg() {
  const blob = new Blob([svg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = importedName.value || 'writelikeme-code.svg'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  message.value = 'SVG downloaded.'
}

async function importSvg(event) {
  const file = event.target.files && event.target.files[0]
  event.target.value = ''
  if (!file) return
  try {
    imported.value = writeLikeMe.value.readStyleCode(await file.text())
    importedName.value = file.name
    draft.value = ''
    message.value = `Loaded style code from ${file.name}.`
  } catch (error) {
    message.value = `That file is not a readable WriteLikeMe style code: ${errorText(error)}`
  }
}

function clearImport() {
  imported.value = null
  importedName.value = ''
  draft.value = ''
  message.value = 'Back to analyzing the sample text.'
}

function writeDraft() {
  if (!prompt.value.trim()) {
    message.value = 'Enter a prompt for the local draft.'
    return
  }
  draft.value = writeLikeMe.value.writeLikeMe(prompt.value, profile.value)
}
</script>

<template>
  <section class="style-demo" aria-labelledby="demo-title">
    <div class="demo-intro">
      <h2 id="demo-title">Try it with your own text</h2>
      <p>Text stays in your browser. Paste writing (or load a shared <code>.svg</code> style code), then download the SVG or copy the style brief into your AI tool.</p>
    </div>

    <template v-if="writeLikeMe && profile">
      <div v-if="imported" class="import-banner">
        <span>Using the profile from <strong>{{ importedName }}</strong>.</span>
        <button type="button" @click="clearImport">Analyze text instead</button>
      </div>
      <template v-else>
        <label class="demo-label" for="sample-text">Sample text</label>
        <textarea id="sample-text" v-model="text" rows="6" spellcheck="true"></textarea>
      </template>
      <div class="demo-actions">
        <button type="button" @click="fileInput.click()">Load an SVG style code…</button>
        <input ref="fileInput" type="file" accept=".svg,image/svg+xml" hidden @change="importSvg">
      </div>

      <div class="demo-layout">
      <div class="score-panel">
        <h3>Style profile</h3>
        <template v-if="!imported">
          <p class="count-summary">{{ profile.stats.wordCount }} words · {{ profile.stats.charCount }} characters</p>
          <p class="count-summary punctuation-summary">{{ profile.stats.commaCount }} commas · {{ profile.stats.periodCount }} periods</p>
        </template>
        <ul class="score-list">
          <li v-for="[key, label] in categories" :key="key">
            <div class="score-heading">
              <span>{{ label }}</span>
              <strong>{{ Math.round(profile.categories[key] * 100) }}%</strong>
            </div>
            <div class="score-track" aria-hidden="true">
              <span :style="{ width: `${profile.categories[key] * 100}%` }"></span>
            </div>
          </li>
        </ul>
        <p v-if="!imported" class="confidence">Signal strength: {{ Math.round(profile.stats.confidence * 100) }}% (based on text length)</p>
      </div>

      <div class="preview-panel">
        <h3>WriteLikeMe Code</h3>
        <div class="svg-preview" role="img" aria-label="QR-inspired code generated from the writing style profile" v-html="svg"></div>
        <div class="demo-actions">
          <label style="display:inline-flex;align-items:center;margin:0 12px 0 0;font-weight:normal;font-size:0.9rem;color:#a9b6c8;">
            <input type="checkbox" v-model="includeWords" style="margin-right:6px;">
            Leave out frequent words (privacy)
          </label>
          <button type="button" class="demo-primary" @click="downloadSvg">Download SVG</button>
          <button type="button" @click="copy(svg, 'SVG markup')">Copy SVG</button>
        </div>
      </div>
      </div>

      <div class="brief-panel">
        <h3>Style brief for AI tools</h3>
        <p class="hint">About 100 tokens. Paste it into Claude Code, Cursor, Codex, Qwen Code or any chat so the model writes in this voice.</p>
        <pre class="brief">{{ brief }}</pre>
        <div class="demo-actions">
          <button type="button" class="demo-primary" @click="copy(agentPrompt, 'Agent prompt')">Copy agent prompt</button>
          <button type="button" @click="copy(brief, 'Style brief')">Copy brief only</button>
        </div>
      </div>

      <div class="brief-panel">
        <h3>Local draft (no AI)</h3>
        <label class="demo-label" for="draft-prompt">Prompt</label>
        <input id="draft-prompt" v-model="prompt" class="prompt-input" type="text" @keydown.enter="writeDraft">
        <div class="demo-actions">
          <button type="button" @click="writeDraft">Write draft</button>
        </div>
        <p v-if="draft" class="draft">{{ draft }}</p>
      </div>

      <details class="generated-code">
      <summary>Do the same in Node.js</summary>
      <pre><code>{{ code }}</code></pre>
      <div class="demo-actions code-actions">
        <button type="button" @click="copy(code, 'JavaScript')">Copy JavaScript</button>
      </div>
      </details>
    </template>
    <p v-else-if="!message" class="demo-loading">Preparing the browser analyzer…</p>
    <p class="demo-message" role="status" aria-live="polite">{{ message }}</p>
    <p class="demo-disclaimer">These are lightweight dictionary and text-shape heuristics, not an AI assessment. Results can be inaccurate, especially for short text or languages other than English. The SVG stores up to five frequent words from your sample; check it before sharing.</p>
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
.prompt-input:focus-visible,
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

.brief-panel {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #28374c;
  border-radius: 10px;
  background: #101827;
}

.brief-panel h3 {
  margin: 0 0 6px;
}

.hint {
  margin: 0 0 10px;
  color: #9fb0c5;
  font-size: 0.9rem;
}

.brief,
.draft {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #0b1220;
  color: #d9e5f2;
  white-space: pre-wrap;
  font: 0.88rem/1.6 ui-monospace, SFMono-Regular, Consolas, monospace;
}

.draft {
  margin-top: 12px;
  font-family: inherit;
}

.prompt-input {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #28374c;
  border-radius: 8px;
  background: #0b1220;
  color: #edf2f7;
  font: inherit;
}

.import-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #73e0bd;
  border-radius: 8px;
  color: #d9e5f2;
}

.code-actions {
  padding: 0 14px 14px;
}
</style>
