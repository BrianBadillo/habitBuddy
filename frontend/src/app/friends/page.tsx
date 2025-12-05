// src/app/friends/page.tsx

import { api } from '@/lib/apiClient';
import { FriendsClient } from './FriendsClient';

export default async function FriendsPage() {
  try {
    const [me, friends] = await Promise.all([
      api.getMe(),
      api.getFriends(),
    ]);

    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Friends</h1>
        <FriendsClient
          initialFriends={friends}
          currentUserId={me.user.id}
        />
      </div>
    );
  } catch (e) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Friends</h1>
        <p className="text-sm text-red-600">Error loading friends.</p>
      </div>
    );
  }
}
