import { arrayRemove,arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth,db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";

const Detail = () => {
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();

    const handleBlock = async () => {
        if (!user) return;
        const userDocRef = doc(db,"users",currentUser.id);
        try{
          await updateDoc(userDocRef, {
            blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
          });
          changeBlock();
        }catch(err){
          console.log(err);
        }
        };

    return (
        <div className='detail'>
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="" />
                <h2>{user?.username}</h2>
                <p>Hey Aryan This Side.</p>
            </div>
            <div className="button">
                <button onClick={handleBlock}>
                  {isCurrentUserBlocked 
                   ? "You are Blocked!"
                   : isReceiverBlocked 
                   ? "User Blocked" 
                   : "Block User"}

                </button>
                <button className="logout" onClick={() => auth.signOut()}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Detail;
