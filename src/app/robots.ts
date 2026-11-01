import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/admin/',
          '/api/admin',
          '/auth/',
          '/auth/login',
          '/profile',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/admin/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://www.cricplus24.in/sitemap.xml',
    host: 'https://www.cricplus24.in',
  };
}
