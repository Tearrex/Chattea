import React, { useState, useEffect } from 'react';
import { useAuth, _dbRef } from "./components/firebase";
import { doc, addDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import {BrowserRouter as Router, Route, Link, Routes, useNavigate} from "react-router-dom";
import { MembersContext, UserContext, showLogin } from './components/Contexts';

import TeaBar from './components/TeaBar';

// Pages
import Home from './components/Pages/Home';
import ProfilePage from './components/Pages/ProfilePage';
import BriefPost from './components/Pages/BriefPost';
import SplashPage from './components/Pages/SplashPage';
import FAQ from './components/Pages/FAQ/FAQPage';
// Styles
import "./components/Styles/Home.scss";
import "./components/Styles/Splash.scss";
import "./components/Styles/UserProfile.scss";


import Signup from './components/Signup';
function App() {

  const currentUser = useAuth();
  const [_user, _setUser] = useState(undefined);
  const [_users, _setUsers] = useState({});
  /*useEffect(() => {
    fetch("/home").then(
      res => res.json()
    ).then(
      (posts) => {
        setPosts(posts.members)
        console.log("fetched posts")
        console.log(posts)
      }
    )
  }, [])*/
  const [_username, setUsername] = useState("");
  const[_pfp, setPfp] = useState("default_user.png");
  useEffect(() => {
    if(currentUser !== null && currentUser !== undefined)
    {
      // get the current user's data for future reference
      const docRef = doc(_dbRef, "users", currentUser.uid);
      getDoc(docRef).then((s) => {
        if(s.exists())
        {
          var _user = s.data();
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

  const [_showLogin, setLogin] = useState(false);
  return (
    <Router>
      <UserContext.Provider value={{_user, _setUser}}>
        <MembersContext.Provider value={{_users, _setUsers}}>
          <showLogin.Provider value={{_showLogin, setLogin}}>
            <div id="main">
              <div className={currentUser ? "passive light" : "passive dark"} />
              <TeaBar />
              <Signup />
              <Routes>
                <Route path="/" element={<SplashPage />}/>
                {/* make a whole page component for the main feed */}
                <Route path="/main" element={<Home/>}/>
                <Route exact path="/profile/:user_id" element={<ProfilePage/>}/>
                <Route exact path="/post/:post_id" element={<BriefPost />}/>
                <Route path="/faq" element={<FAQ/>}/>
              </Routes>
            </div>
          </showLogin.Provider>
        </MembersContext.Provider>
      </UserContext.Provider>
    </Router>
  )
}

export default App