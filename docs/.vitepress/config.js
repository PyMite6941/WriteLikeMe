export default {
  title: 'WriteLikeMe',
  description: 'Analyze writing style and create a compact, QR-inspired WriteLikeMe Code.',
  base: '/WriteLikeMe/',
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/WriteLikeMe/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/WriteLikeMe/apple-touch-icon.svg' }],
    ['link', { rel: 'manifest', href: '/WriteLikeMe/site.webmanifest' }],
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
          { text: 'generateStyleSVG', link: '/api/generate-style-svg' }
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
