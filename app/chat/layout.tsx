"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("group-1");

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedGroupId={selectedGroupId}
        onGroupSelect={setSelectedGroupId}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {children}
      </main>
    </div>
  );
}
