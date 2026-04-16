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
      title: 'Matériel introuvable — Sɔrɔ',
    };
  }

  const typeLabel = materiel.type.charAt(0) + materiel.type.slice(1).toLowerCase();
  const title = `Location ${typeLabel} à ${materiel.commune} (${materiel.region}) — Sɔrɔ`;
  const description = `Louez un ${typeLabel} pour ${materiel.prixJour.toLocaleString('fr')} FCFA/jour. Caution : ${materiel.caution.toLocaleString('fr')} FCFA. Contactez le propriétaire ${materiel.proprietaire.nom} sur Sɔrɔ Mali.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://soro.vercel.app/materiel/${materiel.id}`,
      images: [
        {
          url: materiel.photoUrl || 'https://soro.vercel.app/images/logo-soro.png',
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
