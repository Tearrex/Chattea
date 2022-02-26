import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore'
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";

// Main
import { useAuth, _dbRef } from "./components/Main/firebase";
import { MembersContext, UserContext, showLogin } from './components/Main/Contexts';
import TeaBar from './components/Main/TeaBar';
import Signup from './components/Main/Signup';

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

function App() {

  const currentUser = useAuth();

  // This state holds the profile data of
  // the user that is currently logged in.
  // if _user is undefined, they are most likely a guest
  const [_user, _setUser] = useState(undefined);

  // stores profile data of people that
  // the user encounters on the website.

  // the state will be backed up into localStorage
  // to persist through page refreshes,
  // mitigating the client's read requests
  const [_users, _setUsers] = useState({});

  // i had no idea what this did before...
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

  // as soon as the user authenticates, we request their
  // account info to personalize their experience.
  useEffect(() => {
    if(currentUser && !_user)
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
      // check if the user has cached profile data in their browser

      // it should probably be cleared when the user logs out
      // otherwhise, refresh with new data every few days or so
      const localUsers = localStorage.getItem("users");
      if(localUsers)
      {
        // if so, save the cache of the users
        // into state so we don't ask for their data again
        var _json = JSON.parse(localUsers);
        _setUsers(_json);
        console.log(`Loaded ${Object.entries(_json).length} users from localStorage`);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (_user !== undefined)
    {
      console.log("Current User:",_user);
    }
  }, [_user]);
  useEffect(() => {
    if(_users && Object.entries(_users).length > 0)
    {
      // don't overwrite yourself
      if(JSON.stringify(_users) === localStorage.getItem("users")) return;
      localStorage.setItem("users", JSON.stringify(_users));
      console.log("Users saved to localStorage");
    }
  }, [_users]);
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