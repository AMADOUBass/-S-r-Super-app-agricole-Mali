import useStore from '@/store/useStore';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
import bm from '@/locales/bm.json';

const dictionaries: Record<string, any> = {
  FR: fr,
  EN: en,
  BM: bm,
};

export function useTranslation() {
  const locale = useStore((s) => s.locale) || 'FR';
  
  // Fonction de récupération sécurisée d'une clé (ex: "nav.home")
  const t = (path: string) => {
    const keys = path.split('.');
    let result = dictionaries[locale];
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        // Fallback sur le français si la clé manque dans la langue actuelle
        result = dictionaries['FR'];
        for (const fKey of keys) {
          if (result && result[fKey]) {
            result = result[fKey];
          } else {
            return path; // Retourne la clé brute si vraiment introuvable
          }
        }
        return result;
      }
    }
    
    return result;
  };

  return { t, locale };
}
