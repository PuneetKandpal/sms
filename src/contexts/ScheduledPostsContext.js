"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const ScheduledPostsContext = createContext();

export const useScheduledPosts = () => {
  const context = useContext(ScheduledPostsContext);
  if (!context) {
    throw new Error(
      "useScheduledPosts must be used within a ScheduledPostsProvider"
    );
  }
  return context;
};

export const ScheduledPostsProvider = ({ children }) => {
  const [scheduledPosts, setScheduledPosts] = useState([]);

  // Load scheduled posts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("scheduledPosts");
    if (saved) {
      try {
        setScheduledPosts(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading scheduled posts:", error);
      }
    }
  }, []);

  // Save to localStorage whenever scheduledPosts changes
  useEffect(() => {
    localStorage.setItem("scheduledPosts", JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  const addScheduledPost = (post) => {
    const newPost = {
      ...post,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      status: "scheduled",
    };
    setScheduledPosts((prev) => [...prev, newPost]);
    return newPost;
  };

  const addMultipleScheduledPosts = (posts) => {
    const newPosts = posts.map((post, index) => ({
      ...post,
      id: Date.now() + index + Math.random(),
      createdAt: new Date().toISOString(),
      status: "scheduled",
    }));
    setScheduledPosts((prev) => [...prev, ...newPosts]);
    return newPosts;
  };

  const updateScheduledPost = (id, updates) => {
    setScheduledPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, ...updates } : post))
    );
  };

  const deleteScheduledPost = (id) => {
    setScheduledPosts((prev) => prev.filter((post) => post.id !== id));
    toast.success("Scheduled post deleted");
  };

  const deleteMultipleScheduledPosts = (ids) => {
    setScheduledPosts((prev) => prev.filter((post) => !ids.includes(post.id)));
    toast.success(`${ids.length} scheduled posts deleted`);
  };

  const publishScheduledPost = (id) => {
    setScheduledPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              status: "published",
              publishedAt: new Date().toISOString(),
            }
          : post
      )
    );
    toast.success("Post published successfully");
  };

  const publishMultipleScheduledPosts = (ids) => {
    setScheduledPosts((prev) =>
      prev.map((post) =>
        ids.includes(post.id)
          ? {
              ...post,
              status: "published",
              publishedAt: new Date().toISOString(),
            }
          : post
      )
    );
    toast.success(`${ids.length} posts published successfully`);
  };

  const getScheduledPostsCount = () =>
    scheduledPosts.filter((p) => p.status === "scheduled").length;
  const getPublishedPostsCount = () =>
    scheduledPosts.filter((p) => p.status === "published").length;
  const getDraftPostsCount = () =>
    scheduledPosts.filter((p) => p.status === "draft").length;

  const value = {
    scheduledPosts,
    addScheduledPost,
    addMultipleScheduledPosts,
    updateScheduledPost,
    deleteScheduledPost,
    deleteMultipleScheduledPosts,
    publishScheduledPost,
    publishMultipleScheduledPosts,
    getScheduledPostsCount,
    getPublishedPostsCount,
    getDraftPostsCount,
  };

  return (
    <ScheduledPostsContext.Provider value={value}>
      {children}
    </ScheduledPostsContext.Provider>
  );
};
