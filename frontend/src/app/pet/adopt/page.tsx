// src/app/pet/adopt/page.tsx
import { api } from '@/lib/apiClient';
import { Pet, PetType } from '@/types/api';
import { AdoptClient } from './AdoptClient';

export default async function AdoptPetPage() {
  let existingPet: Pet | null = null;
  try {
    existingPet = await api.getPet();
  } catch {
    existingPet = null;
  }

  let petTypes: PetType[] = [];
  try {
    petTypes = await api.getPetTypes();
  } catch {
    petTypes = [];
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600">
          Adoption center
        </p>
        <h1 className="text-2xl font-bold">Choose your new buddy</h1>
        <p className="text-sm text-slate-600">
          Browse the available companions and claim one to join your habit
          journey.
        </p>
      </div>

      <AdoptClient petTypes={petTypes} existingPet={existingPet} />
    </div>
  );
}
