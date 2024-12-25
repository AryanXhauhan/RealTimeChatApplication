import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (snapshot) => {
        const chatItems = snapshot.data()?.chats || [];

        const chatData = await Promise.all(
          chatItems.map(async (item) => {
            try {
              const userDoc = await getDoc(doc(db, "users", item.receiverId));
              return userDoc.exists()
                ? { ...item, user: userDoc.data() }
                : { ...item, user: {} };
            } catch (error) {
              console.error("Error fetching user data:", error);
              return { ...item, user: {} };
            }
          })
        );

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      },
      (error) => console.error("Error fetching chats:", error)
    );

    return () => unsubscribe();
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    try {
      const updatedChats = chats.map((c) =>
        c.chatId === chat.chatId ? { ...c, isSeen: true } : c
      );

      await updateDoc(doc(db, "userchats", currentUser.id), {
        chats: updatedChats,
      });

      changeChat(chat.chatId, chat.user);
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      {/* Chat Items */}
      {filteredChats.length > 0 ? (
        filteredChats.map((chat) => (
          <div
            className="item"
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
            style={{
              backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
            }}
          >
            <img
              src={
                chat.user.blocked.includes(currentUser.id)
                  ? "./avatar.png"
                  : chat.user.avatar || "./avatar.png"
              }
              alt="User Avatar"
            />
            <div className="texts">
              <span>
                {chat.user.blocked.includes(currentUser.id)
                  ? "User"
                  : chat.user.username}
              </span>
              <p>{chat.lastMessage || "No messages yet"}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No chats available</p>
      )}

      {/* Add User Component */}
      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
