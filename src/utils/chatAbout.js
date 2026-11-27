// Where the "About: (post title)" lines go in a chat (see components/ChatAbout).

/** For each message: does an "About" line go above it? Only where the talk turns to a post (again, or another one). */
export const aboutStarts = (messages) => {
  let current = null;
  return messages.map((m) => {
    if (!m.about || m.about.postId === current) return false;
    current = m.about.postId;
    return true;
  });
};

/** The post the chat last turned to, if any. */
export const lastAbout = (messages) => [...messages].reverse().find((m) => m.about)?.about.postId || null;
