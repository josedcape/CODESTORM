import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';

interface UseChatVisibilityProps {
  initialVisible?: boolean;
  messages: ChatMessage[];
}

interface UseChatVisibilityReturn {
  isChatVisible: boolean;
  isChatModalOpen: boolean;
  showFloatingButton: boolean;
  unreadCount: number;
  hasUnreadMessages: boolean;
  showChat: () => void;
  hideChat: () => void;
  toggleChat: () => void;
  openChatModal: () => void;
  closeChatModal: () => void;
  markAllAsRead: () => void;
}

export const useChatVisibility = ({
  initialVisible = true,
  messages
}: UseChatVisibilityProps): UseChatVisibilityReturn => {
  const [isChatVisible, setIsChatVisible] = useState(initialVisible);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Calculate unread messages
  const unreadCount = (() => {
    if (!lastReadMessageId || messages.length === 0) {
      return userHasInteracted ? messages.filter(m => m.sender === 'ai').length : 0;
    }
    
    const lastReadIndex = messages.findIndex(m => m.id === lastReadMessageId);
    if (lastReadIndex === -1) return 0;
    
    return messages.slice(lastReadIndex + 1).filter(m => m.sender === 'ai').length;
  })();

  const hasUnreadMessages = unreadCount > 0;

  // Show floating button when chat is hidden and there are messages
  const showFloatingButton = !isChatVisible && !isChatModalOpen && messages.length > 0;

  // Mark messages as read when chat becomes visible
  useEffect(() => {
    if ((isChatVisible || isChatModalOpen) && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setLastReadMessageId(latestMessage.id);
    }
  }, [isChatVisible, isChatModalOpen, messages]);

  // Auto-hide chat on mobile devices initially
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !userHasInteracted) {
      setIsChatVisible(false);
    }
  }, [userHasInteracted]);

  const showChat = useCallback(() => {
    setIsChatVisible(true);
    setIsChatModalOpen(false);
    setUserHasInteracted(true);
  }, []);

  const hideChat = useCallback(() => {
    setIsChatVisible(false);
    setUserHasInteracted(true);
  }, []);

  const toggleChat = useCallback(() => {
    if (isChatVisible) {
      hideChat();
    } else {
      showChat();
    }
  }, [isChatVisible, showChat, hideChat]);

  const openChatModal = useCallback(() => {
    setIsChatModalOpen(true);
    setIsChatVisible(false);
    setUserHasInteracted(true);
  }, []);

  const closeChatModal = useCallback(() => {
    setIsChatModalOpen(false);
    setUserHasInteracted(true);
  }, []);

  const markAllAsRead = useCallback(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setLastReadMessageId(latestMessage.id);
    }
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C to toggle chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (isChatModalOpen) {
          closeChatModal();
        } else if (isChatVisible) {
          hideChat();
        } else {
          openChatModal();
        }
      }
      
      // Ctrl/Cmd + M to toggle between inline and modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && (isChatVisible || isChatModalOpen)) {
        e.preventDefault();
        if (isChatVisible) {
          openChatModal();
        } else {
          showChat();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isChatVisible, isChatModalOpen, showChat, hideChat, openChatModal, closeChatModal]);

  // Auto-show chat when new AI messages arrive (if user hasn't manually hidden it)
  useEffect(() => {
    if (messages.length > 0 && !userHasInteracted) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender === 'ai' && latestMessage.type === 'success') {
        // Auto-show chat for important messages
        setIsChatVisible(true);
      }
    }
  }, [messages, userHasInteracted]);

  return {
    isChatVisible,
    isChatModalOpen,
    showFloatingButton,
    unreadCount,
    hasUnreadMessages,
    showChat,
    hideChat,
    toggleChat,
    openChatModal,
    closeChatModal,
    markAllAsRead
  };
};
