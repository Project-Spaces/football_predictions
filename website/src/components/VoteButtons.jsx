"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function VoteButtons({ predictionRank, initialVotes, initialUserVote }) {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(initialVotes?.upvotes || 0);
  const [downvotes, setDownvotes] = useState(initialVotes?.downvotes || 0);
  const [userVote, setUserVote] = useState(initialUserVote || null);
  const [loading, setLoading] = useState(false);

  const handleVote = async (vote) => {
    if (!session) return;
    if (loading) return;

    setLoading(true);

    // Optimistic update
    const prevUp = upvotes;
    const prevDown = downvotes;
    const prevVote = userVote;

    if (userVote === vote) {
      // Toggle off
      setUserVote(null);
      if (vote === "up") setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
    } else {
      // New or changed vote
      if (userVote === "up") setUpvotes((v) => v - 1);
      if (userVote === "down") setDownvotes((v) => v - 1);
      setUserVote(vote);
      if (vote === "up") setUpvotes((v) => v + 1);
      else setDownvotes((v) => v + 1);
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionRank, vote }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] text-text-secondary">Community:</span>
      <button
        onClick={() => handleVote("up")}
        disabled={!session}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
          userVote === "up"
            ? "bg-prob-green/15 text-prob-green"
            : "bg-bg-primary text-text-secondary hover:text-prob-green"
        } ${!session ? "opacity-50 cursor-not-allowed" : ""}`}
        title={session ? "Upvote" : "Sign in to vote"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
        {upvotes}
      </button>
      <button
        onClick={() => handleVote("down")}
        disabled={!session}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
          userVote === "down"
            ? "bg-prob-orange/15 text-prob-orange"
            : "bg-bg-primary text-text-secondary hover:text-prob-orange"
        } ${!session ? "opacity-50 cursor-not-allowed" : ""}`}
        title={session ? "Downvote" : "Sign in to vote"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
        {downvotes}
      </button>
    </div>
  );
}
