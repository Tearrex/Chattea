import React, { useState, useEffect } from 'react';
import { useAuth, _dbRef } from "./components/firebase";
import { addDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import Splash from './components/Splash';
import {BrowserRouter as Router, Route, Link, Routes, useNavigate} from "react-router-dom";
import { MembersContext, UserContext } from './components/UserContext';
import Home from './components/Pages/Home';
import TeaBar from './components/TeaBar';
import ProfilePage from './components/Pages/ProfilePage';
import "./components/Styles/Home.scss";
import "./components/Styles/Splash.css";
import "./components/Styles/UserProfile.css";
function App() {

  const currentUser = useAuth();
  const [_user, _setUser] = useState(undefined);
  const [_users, _setUsers] = useState({});
  /*useEffect(() => {
    fetch("/home").then(
      res => res.json()
    ).then(
      posts => {
        setPosts(posts.members)
        console.log("fetched posts")
        console.log(posts)
      }
    )
  }, [])*/
  const [user_id, setUserID] = useState("");
  const [_username, setUsername] = useState("");
  const[_pfp, setPfp] = useState("default_user.png");
  useEffect(() => {
    if(currentUser !== null && currentUser !== undefined && user_id === "")
    {
      // get the current user's ID for future reference
      const usersRef = collection(_dbRef, "users");
      const q = query(usersRef, where("email", "==", currentUser.email));
      const _doc = getDocs(q).then((snapshot) => {
        var _user = snapshot.docs[0];
        setUserID(_user.id);
        _setUser({
          user_id: _user.id,
          username: _user.data()["username"],
          pfp: _user.data()["pfp"],
          join_date: _user.data()["joined"],
          banner: _user.data()["banner"],
          about: _user.data()["about"],
          buddies: _user.data()["buddies"],
          role: _user.data()["role"]
        });
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (_user !== undefined)
    {
      console.log("Fetched user:",_user);
    }
  }, [_user]);

  return (
    <Router>
      <UserContext.Provider value={{_user, _setUser}}>
        <MembersContext.Provider value={{_users, _setUsers}}>
          <div id="main">
            <TeaBar />
            <Routes>
              <Route path="/" element={<Splash />}/>
              {/* make a whole page component for the main feed */}
              <Route path="/main" element={<Home/>}/>
              <Route exact path="/profile/:user_id" element={<ProfilePage/>}/>
            </Routes>
          </div>
        </MembersContext.Provider>
      </UserContext.Provider>
    </Router>
  )
}

export default App