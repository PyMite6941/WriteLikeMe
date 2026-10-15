const configuredBase = process.env.VITEPRESS_BASE === undefined
  ? '/WriteLikeMe/'
  : process.env.VITEPRESS_BASE;
const baseSegments = configuredBase.split('/').filter(Boolean);
const base = baseSegments.length ? '/' + baseSegments.join('/') + '/' : '/';

export default {
  title: 'WriteLikeMe',
  description: 'Analyze writing locally, share style profiles, and create style-guided drafts.',
  base,
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: base + 'favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: base + 'apple-touch-icon.svg' }],
    ['link', { rel: 'manifest', href: base + 'site.webmanifest' }],
    ['meta', { name: 'theme-color', content: '#101827' }]
  ],
  themeConfig: {
    siteTitle: 'WriteLikeMe',
    nav: [
      { text: 'Quick start', link: '/#quick-start' },
      { text: 'API', link: '/api/analyze-text' },
      { text: 'Examples', link: '/examples/basic-usage' },
      { text: 'GitHub', link: 'https://github.com/PyMite6941/WriteLikeMe' }
    ],
    footer: {
      message: 'WriteLikeMe · MIT License',
      copyright: 'Source on GitHub: PyMite6941/WriteLikeMe'
    },
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' }
          ]
        }
      ],
      '/api/': [{
        text: 'API Reference',
        items: [
          { text: 'analyzeText', link: '/api/analyze-text' },
          { text: 'generateStyleSVG', link: '/api/generate-style-svg' },
          { text: 'Style code and local writing', link: '/api/style-code' }
        ]
      }],
      '/examples/': [
        { text: 'Basic Usage', link: '/examples/basic-usage' },
        { text: 'Custom Categories', link: '/examples/custom-categories' },
        { text: 'AI Code', link: '/examples/ai-code' }
      ]
    }
  }
}
