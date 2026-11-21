import { useEffect, useState } from 'react';
import api from '../utils/api';

/** Has the signed-in member blocked this person? (null while loading) */
export default function useIsBlocked(userId) {
  const [blocked, setBlocked] = useState(null);
  useEffect(() => {
    let live = true;
    if (!userId) return undefined;
    api.get('safety/blocks')
      .then((res) => { if (live) setBlocked((res.data || []).some((b) => b.userId === userId)); })
      .catch(() => { if (live) setBlocked(false); });
    return () => { live = false; };
  }, [userId]);
  return [blocked, setBlocked];
}

