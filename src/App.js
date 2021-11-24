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
import BriefPost from './components/Pages/BriefPost';
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
            ..._user
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
              <Route exact path="/post/:post_id" element={<BriefPost />}/>
            </Routes>
          </div>
        </MembersContext.Provider>
      </UserContext.Provider>
    </Router>
  )
}

export default App