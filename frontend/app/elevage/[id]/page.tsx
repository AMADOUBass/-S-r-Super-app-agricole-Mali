import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ElevageDetailClient } from '@/components/views/ElevageDetailClient';

interface Props {
  params: { id: string };
}

async function getAnimal(id: string) {
  try {
    const res = await api.get(`/elevage/${id}`);
    return res.data.data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const animal = await getAnimal(params.id);

  if (!animal) {
    return {
      title: 'Annonce introuvable — Sɔrɔ',
    };
  }

  const typeLabel = animal.type.charAt(0) + animal.type.slice(1).toLowerCase();
  const title = `Vente ${typeLabel} à ${animal.commune} (${animal.region}) — Sɔrɔ`;
  const description = `Achetez un ${typeLabel}${animal.race ? ` de race ${animal.race}` : ''} pour ${animal.prixFcfa.toLocaleString('fr')} FCFA. Contactez l'éleveur ${animal.vendeur.nom} sur Sɔrɔ, votre plateforme d'élevage au Mali.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://soro.vercel.app/elevage/${animal.id}`,
      images: [
        {
          url: animal.photoUrl || 'https://soro.vercel.app/images/logo-soro.png',
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
      images: [animal.photoUrl || 'https://soro.vercel.app/images/logo-soro.png'],
    },
  };
}

export default async function Page({ params }: Props) {
  const animal = await getAnimal(params.id);

  if (!animal) {
    notFound();
  }

  return <ElevageDetailClient animal={animal} />;
}
