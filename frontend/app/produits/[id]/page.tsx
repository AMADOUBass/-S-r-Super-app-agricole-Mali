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
      title: 'Annonce introuvable — Sɔrɔ',
    };
  }

  const typeLabel = produit.type.charAt(0) + produit.type.slice(1).toLowerCase();
  const title = `Acheter ${produit.quantiteKg}kg de ${typeLabel} à ${produit.commune} — Sɔrɔ`;
  const description = `Prix : ${produit.prixFcfa.toLocaleString('fr')} FCFA/kg. Connectez-vous avec ${produit.agriculteur.nom} à ${produit.commune} (${produit.region}) sur Sɔrɔ, votre marché agricole au Mali.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://soro.vercel.app/produits/${produit.id}`,
      images: [
        {
          url: produit.photoUrl || 'https://soro.vercel.app/images/logo-soro.png',
          width: 800,
          height: 600,
          alt: typeLabel,
        },
      ],
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
