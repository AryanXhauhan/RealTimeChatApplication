import { doc, updateDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";
import { useUserStore } from "./userStore";

export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false, 
  isReceiverBlocked: false,


  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    
    const userBlockedList = user.blocked || [];
    const currentUserBlockedList = currentUser.blocked || [];

    set({
      chatId,
      user,
      isCurrentUserBlocked: userBlockedList.includes(currentUser.id), 
      isReceiverBlocked: currentUserBlockedList.includes(user.id), 
    });
  },

  // Block/unblock user functionality
  changeBlock: async (blockStatus) => {
    const currentUser = useUserStore.getState().currentUser;
    const chatUser = get().user;

    if (!currentUser || !chatUser) return;

    const currentUserRef = doc(db, "users", currentUser.id);

    try {
      if (blockStatus) {
       
        await updateDoc(currentUserRef, {
          blocked: arrayUnion(chatUser.id),
        });
      } else {
      
        await updateDoc(currentUserRef, {
          blocked: arrayRemove(chatUser.id),
        });
      }

      set({ isReceiverBlocked: blockStatus });
    } catch (error) {
      console.error("Failed to block/unblock user:", error);
    }
  },

  sendMessage: async (message) => {
    const { isCurrentUserBlocked, isReceiverBlocked } = get();

    if (isCurrentUserBlocked || isReceiverBlocked) {
      alert("You cannot send messages to a blocked user.");
      return;
    }

    console.log("Text message sent:", message);
  },

  sendImage: async (image) => {
    const { isCurrentUserBlocked, isReceiverBlocked } = get();

    if (isCurrentUserBlocked || isReceiverBlocked) {
      alert("You cannot send images to a blocked user.");
      return;
    }

    console.log("Image sent:", image);
  },
}));
