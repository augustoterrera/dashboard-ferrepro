// context/ConversationContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Conversation } from '@/types/conversation';

interface ConversationContextType {
  conversationsLocal: Conversation[];
  setConversationsLocal: React.Dispatch<
    React.SetStateAction<Conversation[]>
  >;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

interface ConversationProviderProps {
  children: ReactNode;
  initialConversations?: Conversation[];
}

export const ConversationProvider = ({
  children,
  initialConversations = [],
}: ConversationProviderProps) => {
  const [conversationsLocal, setConversationsLocal] =
    useState<Conversation[]>(initialConversations);

  return (
    <ConversationContext.Provider
      value={{ conversationsLocal, setConversationsLocal }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      'useConversationContext debe usarse dentro de ConversationProvider'
    );
  }
  return context;
};
