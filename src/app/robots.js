export default function robots() {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: [ '/anime/', '/api/' ],
      },
      sitemap: 'https://anikazenow.live/sitemap.xml',
    }
  }