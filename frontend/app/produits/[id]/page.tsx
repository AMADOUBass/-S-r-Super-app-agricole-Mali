import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ProduitDetailClient } from '@/components/views/ProduitDetailClient';

interface Props {
  params: { id: string };
}

// Fonction pour récupérer les données du produit (utilisée par Metadata + Page)
async function getProduit(id: string) {
  try {
    const res = await api.get(`/produits/${id}`);
    return res.data.data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const produit = await getProduit(params.id);

  if (!produit) {
    return {
      title: 'Annonce introuvable | Sɔrô',
    };
  }

  const typeLabel = produit.type.charAt(0) + produit.type.slice(1).toLowerCase();
  const title = `${typeLabel} à vendre - ${produit.commune} | Sɔrô`;
  const description = `${produit.quantiteKg}kg de ${typeLabel} à ${produit.prixFcfa.toLocaleString('fr')} FCFA/kg. Disponible à ${produit.commune} (${produit.region}) sur Sɔrô.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://soro.vercel.app/produits/${produit.id}`,
      images: [
        {
          url: produit.photoUrl || 'https://soro.vercel.app/images/logo-soro.png',
          width: 1200,
          height: 630,
          alt: `${typeLabel} à vendre`,
        },
      ],
      siteName: 'Sɔrô',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [produit.photoUrl || 'https://soro.vercel.app/images/logo-soro.png'],
    },
  };
}


export default async function Page({ params }: Props) {
  const produit = await getProduit(params.id);

  if (!produit) {
    notFound();
  }

  return <ProduitDetailClient produit={produit} />;
}
