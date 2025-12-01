// src/app/pet/page.tsx

import { api } from '@/lib/apiClient';
import { PetClient } from './PetClient';

export default async function PetPage() {
  let pet = null;

  try {
    pet = await api.getPet();
  } catch {
    // If backend returns 404 or fails, pet stays null → adopt UI will show
    pet = null;
  }

  return <PetClient initialPet={pet} />;
}
