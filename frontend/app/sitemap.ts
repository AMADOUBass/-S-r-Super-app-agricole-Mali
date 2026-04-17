import { MetadataRoute } from 'next';

const BASE_URL = 'https://soro.vercel.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Routes statiques
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/marche`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${BASE_URL}/produits`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/elevage`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/materiel`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/meteo`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.6 },
  ];

  try {
    // Note: On utilise fetch ici pour éviter les dépendances client-side d'Axios si possible,
    // ou on peut l'importer. Mais fetch est natif en Node/Next.
    
    const [produitsRes, elevageRes, materielRes] = await Promise.all([
      fetch(`${API_URL}/produits?limit=100`).then(res => res.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}/elevage?limit=100`).then(res => res.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}/materiel?limit=100`).then(res => res.json()).catch(() => ({ data: [] })),
    ]);

    const produitsRoutes = (produitsRes.data || []).map((p: any) => ({
      url: `${BASE_URL}/produits/${p.id}`,
      lastModified: new Date(p.updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const elevageRoutes = (elevageRes.data || []).map((a: any) => ({
      url: `${BASE_URL}/elevage/${a.id}`,
      lastModified: new Date(a.updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const materielRoutes = (materielRes.data || []).map((m: any) => ({
      url: `${BASE_URL}/materiel/${m.id}`,
      lastModified: new Date(m.updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...staticRoutes, ...produitsRoutes, ...elevageRoutes, ...materielRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticRoutes;
  }
}
