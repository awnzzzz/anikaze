export default function sitemap() {
    return [
      {
        url: 'https://anikazenow.live',
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 1,
      },
      {
        url: 'https://anikazenow.live/anime/catalog',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://anikazenow.live/anime/catalog?sortby=TRENDING_DESC',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
      {
        url: 'https://anikazenow.live/anime/catalog?format=MOVIE',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
      {
        url: 'https://anikazenow.live/anime/catalog?season=WINTER&year=2024',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
       {
        url: 'https://anikazenow.live/anime/catalog?season=SUMMER&year=2024',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
    ]
  }