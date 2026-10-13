export default {
  title: 'WriteLikeMe',
  description: 'Writing Style Visualizer - Generates SVG circles representing writing style characteristics',
  base: '/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: 'installation' },
            { text: 'Quick Start', link: 'quick-start' }
          ]
        }
      ],
      '/api/': [
        { text: 'API Reference', items: [
          { text: 'analyzeText', link: 'analyze-text' },
          { text: 'generateStyleSVG', link: 'generate-style-svg' }
        ]}
      ],
      '/examples/': [
        { text: 'Basic Usage', link: 'basic-usage' },
        { text: 'Custom Categories', link: 'custom-categories' }
      ]
    }
  }
}
