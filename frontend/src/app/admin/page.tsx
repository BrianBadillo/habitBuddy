// src/app/admin/page.tsx
import { redirect } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { AdminClient } from './AdminClient';

export default async function AdminPage() {
  let me;
  try {
    me = await api.getMe();
  } catch {
    redirect('/auth');
  }

  if (!me || me.user.role !== 'admin') {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-slate-600">
          You need admin access to view this page.
        </p>
      </div>
    );
  }

  const [metrics, petTypes, users] = await Promise.all([
    api.adminGetMetrics(),
    api.adminGetPetTypes(),
    api.adminListUsers(),
  ]);

  return (
    <AdminClient
      initialMetrics={metrics}
      initialPetTypes={petTypes}
      initialUsers={users}
    />
  );
}
