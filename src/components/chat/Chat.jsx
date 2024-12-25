import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatUser, setChatUser] = useState(null); // To store the chat user's details
  const [loadingUser, setLoadingUser] = useState(true); // Track loading state for user data

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  // Scroll to the bottom whenever messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Fetch chat data from Firestore
  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => unSub();
  }, [chatId]);

  // Fetch chat user's details
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserDetails = async () => {
      setLoadingUser(true); // Start loading
      try {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists()) {
          setChatUser(userDoc.data());
        } else {
          console.warn("User data not found!");
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      } finally {
        setLoadingUser(false); // Finish loading
      }
    };

    fetchUserDetails();
  }, [user]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    return data.secure_url;
  };

  const handleSend = async (image = null) => {
    if (text.trim() === "" && !image) return;

    setSending(true);

    try {
      let imageURL = null;

      if (image) {
        imageURL = await uploadImageToCloudinary(image);
      }

      // Check if user is blocked before sending
      if (isCurrentUserBlocked || isReceiverBlocked) {
        alert("You cannot send messages to a blocked user.");
        return;
      }

      // Update the chat document with the new message
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text: image ? null : text,
          img: imageURL || null,
          createdAt: new Date(),
        }),
      });

      setText(""); // Reset input
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) handleSend(file);
  };

  // Format time for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  

  return (
    <div className="chat">
      {/* Chat Header */}
      <div className="top">
        <div className="user">
          {loadingUser ? (
            <span>Loading...</span>
          ) : (
            <>
              <img
                src={chatUser?.avatar || "/avatar.png"}
                alt="User Avatar"
              />
              <div className="texts">
                <span>{chatUser?.username || "Unknown User"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div
            className={`message ${
              message.senderId === currentUser.id ? "own" : ""
            }`}
            key={index}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="Attachment" />}
              {message.text && <p>{message.text}</p>}
              {/* Add Time Here */}
              <span className="time">{formatTime(message.createdAt)}</span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      {/* Chat Input */}
      <div className="bottom">
        <div className="icons">
          <label>
            <img src="./img.png" alt="Upload" />
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
              disabled={isCurrentUserBlocked || isReceiverBlocked}
            />
          </label>
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You can't send messages."
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji Picker"
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button
          className="sendButton"
          onClick={() => handleSend()}
          disabled={
            sending || isCurrentUserBlocked || isReceiverBlocked
          }
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
