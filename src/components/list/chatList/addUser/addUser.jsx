import React, { useState } from "react";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    serverTimestamp,
    setDoc,
    updateDoc,
    arrayUnion,
    getDoc,
} from "firebase/firestore";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
    const [user, setUser] = useState(null);
    const { currentUser } = useUserStore();
    const [error, setError] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.target);
        const username = formData.get("username");

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const querySnapShot = await getDocs(q);

            if (!querySnapShot.empty) {
                setUser(querySnapShot.docs[0].data());
            } else {
                console.log("No user found with that username.");
            }
        } catch (err) {
            console.log("Error searching for user:", err);
        }
    };

    const handleAdd = async () => {
        if (!user || !currentUser) {
            console.log("No user selected or no current user.");
            return;
        }

        const userChatsRef = doc(db, "userchats", currentUser.id);
        const selectedUserChatsRef = doc(db, "userchats", user.id);

        try {
           
            const userChatsSnap = await getDoc(userChatsRef);
            const selectedUserChatsSnap = await getDoc(selectedUserChatsRef);

            if (userChatsSnap.exists() && selectedUserChatsSnap.exists()) {
                const existingChats = userChatsSnap.data()?.chats || [];
                const selectedUserChats = selectedUserChatsSnap.data()?.chats || [];

               
                const userAlreadyExistsInCurrentUserList = existingChats.some(
                    (chat) => chat.receiverId === user.id
                );
                const userAlreadyExistsInSelectedUserList = selectedUserChats.some(
                    (chat) => chat.receiverId === currentUser.id
                );

                if (userAlreadyExistsInCurrentUserList || userAlreadyExistsInSelectedUserList) {
                    setError("User already exists in the chat list.");
                    console.log("User already exists in the chat list.");
                    return;
                }
            }

            
            const chatRef = collection(db, "chats");
            const newChatRef = doc(chatRef);
            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: [],
            });

            const chatDataForUser = {
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: currentUser.id,
                updatedAt: Date.now(),
            };

            const chatDataForCurrentUser = {
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: user.id,
                updatedAt: Date.now(),
            };

            await updateDoc(doc(db, "userchats", user.id), {
                chats: arrayUnion(chatDataForUser),
            });

            await updateDoc(userChatsRef, {
                chats: arrayUnion(chatDataForCurrentUser),
            });

            console.log("Chat added successfully!");

            setUser(null);
            setError("");
        } catch (err) {
            console.log("Error adding user to chat:", err);
        }
    };

    return (
        <div className="addUser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button type="submit">Search</button>
            </form>

            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "./avatar.png"} alt="User Avatar" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd}>Add User</button>
                </div>
            )}

            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default AddUser;
