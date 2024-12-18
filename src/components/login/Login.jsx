import { auth, db } from "../../lib/firebase";
import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import axios from 'axios';

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });
    const [loading, setLoading] = useState(false); // Declare loading state

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const uploadAvatarToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, 
                formData
            );
            return response.data.secure_url;
        } catch (error) {
            console.error('Error uploading image:', error.response ? error.response.data : error.message);
            toast.error(`Error uploading image: ${error.response ? error.response.data.error.message : error.message}`);
            throw error;
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);

        try {
            const avatarUrl = await uploadAvatarToCloudinary(avatar.file);

            const res = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                id: res.user.uid,
                avatar: avatarUrl,
                blocked: [],
            });

            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
            });

            toast.success("Account created! You can login now!");
        } catch (err) {
            console.log(err);
            toast.error(`Error: ${err.message}`);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading to true

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful!");
        } catch (err) {
            console.log(err);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false); // Set loading to false after login attempt
        }
    };

    return (
        <div className="login">
            <div className="item">
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="Email" name="email" required />
                    <input type="password" placeholder="Password" name="password" required />
                    <button type="submit" disabled={loading}>Sign In</button>
                </form>
            </div>
            <div className="separator"></div>
            <div className="item">
                <h2>Create an account</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file" className="file-upload-label">
                        <img src={avatar.url || "./avatar.png"} alt="" />
                        Upload an image
                    </label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <input type="text" placeholder="Username" name="username" required />
                    <input type="text" placeholder="Email" name="email" required />
                    <input type="password" placeholder="Password" name="password" required />
                    <button type="submit" disabled={loading}>Sign Up</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
