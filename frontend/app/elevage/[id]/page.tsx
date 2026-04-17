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
      title: 'Annonce introuvable | Sɔrô',
    };
  }

  const typeLabel = animal.type.charAt(0) + animal.type.slice(1).toLowerCase();
  const title = `${typeLabel} à vendre - ${animal.commune} | Sɔrô`;
  const description = `${typeLabel}${animal.race ? ` (${animal.race})` : ''} à vendre pour ${animal.prixFcfa.toLocaleString('fr')} FCFA. Disponible à ${animal.commune} (${animal.region}) sur Sɔrô.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://soro.vercel.app/elevage/${animal.id}`,
      images: [
        {
          url: animal.photoUrl || 'https://soro.vercel.app/images/logo-soro.png',
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
