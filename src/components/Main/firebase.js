import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { getStorage } from "firebase/storage";
import { getFirestore, addDoc, collection, setDoc, doc } from 'firebase/firestore';
import { useNavigate } from "react-router";
const firebaseConfig = {
    apiKey: "AIzaSyCYecan39TTLGkW4xuk4ez616Fttt3SBuo",
    authDomain: "reactback-1cf7d.firebaseapp.com",
    projectId: "reactback-1cf7d",
    storageBucket: "reactback-1cf7d.appspot.com",
    messagingSenderId: "1045035508556",
    appId: "1:1045035508556:web:a48803d2a89433996c65e9"
};
const app = initializeApp(firebaseConfig);
export const _storageRef = getStorage(app);
export const _dbRef = getFirestore(app);
const auth = getAuth(app);

export async function signup(email, password, username) {
    // get the date that the user signed up
    var objToday = new Date(),
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    curMonth = months[objToday.getMonth()],
    curYear = objToday.getFullYear()
    var today = curMonth + " " + objToday.getDate() + ", " + curYear;

    // send request to server
    var newUser = await createUserWithEmailAndPassword(auth, email, password);
    console.log("made new user with ID " + newUser.user.uid + " and email " + newUser.user.email);
    const _user = {
        about:"",
        banner:"",
        joined: today,
        role:"user",
        buddies:[],
        pfp: "/default_user.png",
        username: username
    };
    await setDoc(doc(_dbRef, "users", newUser.user.uid), _user);
    // return the object to store as the current user in memory
    return {..._user, user_id: newUser.user.uid};
}
export function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}
export function logout()
{
    return signOut(auth);
}
export function useAuth()
{
    const [currentUser, setCurrentUser] = useState();
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
        return unsub;
    }, [])
    return currentUser;
}