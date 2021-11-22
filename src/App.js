import React, { useState, useEffect } from 'react';
import { useAuth, _dbRef } from "./components/firebase";
import { doc, addDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
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
      const docRef = doc(_dbRef, "users", currentUser.uid);
      getDoc(docRef).then((s) => {
        if(s.exists())
        {
          var _user = s.data();
          setUserID(currentUser.uid);
          _setUser({
            user_id: currentUser.uid,
            username: _user["username"],
            pfp: _user["pfp"],
            join_date: _user["joined"],
            banner: _user["banner"],
            about: _user["about"],
            buddies: _user["buddies"],
            role: _user["role"]
          });
        }
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