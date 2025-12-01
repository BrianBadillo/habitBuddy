// src/app/friends/page.tsx

import { api } from '@/lib/apiClient';

export default async function FriendsPage() {
  let friends = [];
  try {
    friends = await api.getFriends();
  } catch (e) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Friends</h1>
        <p className="text-sm text-red-600">
          Could not load friends. Is the backend running?
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Friends</h1>

      {friends.length === 0 ? (
        <p className="text-sm text-slate-600">
          You don&apos;t have any friends yet. Add some in the app!
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border bg-white px-3 py-2 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  {f.friend.displayName || f.friend.username}
                </div>
                <div className="text-xs text-slate-500">
                  @{f.friend.username}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 capitalize">
                  Status: {f.status}
                </div>
              </div>
              <div className="text-xs text-slate-500 text-right">
                Added: {new Date(f.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
