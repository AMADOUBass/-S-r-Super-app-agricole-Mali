import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { MaterielDetailClient } from '@/components/views/MaterielDetailClient';

interface Props {
  params: { id: string };
}

async function getMateriel(id: string) {
  try {
    const res = await api.get(`/materiel/${id}`);
    return res.data.data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const materiel = await getMateriel(params.id);

  if (!materiel) {
    return {
      title: 'Matériel introuvable | Sɔrô',
    };
  }

  const typeLabel = materiel.type.charAt(0) + materiel.type.slice(1).toLowerCase();
  const title = `${typeLabel} à louer - ${materiel.commune} | Sɔrô`;
  const description = `${typeLabel} en location pour ${materiel.prixJour.toLocaleString('fr')} FCFA/jour. Caution : ${materiel.caution.toLocaleString('fr')} FCFA. Disponible à ${materiel.commune} (${materiel.region}) sur Sɔrô.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://soro.vercel.app/materiel/${materiel.id}`,
      images: [
        {
          url: materiel.photoUrl || 'https://soro.vercel.app/images/logo-soro.png',
          width: 1200,
          height: 630,
          alt: `${typeLabel} à louer`,
        },
      ],
      siteName: 'Sɔrô',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [materiel.photoUrl || 'https://soro.vercel.app/images/logo-soro.png'],
    },
  };
}

export default async function Page({ params }: Props) {
  const materiel = await getMateriel(params.id);

  if (!materiel) {
    notFound();
  }

  return <MaterielDetailClient materiel={materiel} />;
}
