// src/components/pet/PetSummaryCard.tsx

import { Pet } from '@/types/api';

interface Props {
  pet?: Pet | null;
}

export function PetSummaryCard({ pet }: Props) {
  if (!pet) {
    return (
      <div className="rounded-xl border p-4 bg-white">
        <h2 className="font-semibold mb-1">Your Pet</h2>
        <p className="text-sm text-slate-600">
          You don&apos;t have a pet yet. Complete onboarding to adopt one!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 bg-white flex gap-4">
      {/* Placeholder avatar */}
      <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-3xl">
        {(pet.currentStage?.spriteUrl || pet.petType?.baseSpriteUrl) && (
                <img
                  src={pet.currentStage?.spriteUrl || pet.petType?.baseSpriteUrl}
                  alt={pet.petType?.name ?? 'Your pet'}
                  className="w-full h-full object-contain"
                />
              )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-lg">{pet.name}</h2>
            <p className="text-sm text-slate-600">
              Level {pet.level} · XP {pet.xp}
            </p>
            <p className="text-xs mt-1 text-slate-500 capitalize">
              Mood: {pet.mood}
            </p>
          </div>
          {pet.currentStage && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {pet.currentStage.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
