//import { Link } from "react-router-dom";
import { useAuth, _dbRef } from "./firebase";
import WelcomeBanner from "./WelcomeBanner";
import Signup from "./Signup";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { MembersContext, UserContext } from "./UserContext";
import NotificationChild from "./NotificationChild";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, getDoc, limit, orderBy, query, doc } from "@firebase/firestore";
import { toComputedKey } from "@babel/types";
function TeaBar ()
{
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const currentUser = useAuth();

    const _col = collection(_dbRef, 'users/'+(_user !== undefined ? _user["user_id"] : "n")+"/notifications");
    const _query = query(_col, orderBy('date','desc'));
    const [notifs] = useCollectionData(_query, {idField: 'id'});
    const [notifCount, setNotifCount] = useState(0);
    const notifNest = useRef();

    const [cache, setCache] = useState([]);
    const [hasCached, setHasCached] = useState(false);
    function check_cache()
    {
        if(cache.length > 0)
        {
            var _toCache = {};
            for (let i = 0; i < cache.length; i++)
            {
                if(_users[cache[i]] === undefined && cache[i] !== _user.user_id)
                {
                    if (_toCache[cache[i]] !== undefined) continue;
                    const userRef = doc(_dbRef, "users", cache[i]);
                    getDoc(userRef).then((snapshot) => {
                        if(snapshot.exists())
                        {
                            //console.log("getting billed by Google!");
                            var _json = snapshot.data();
                            _toCache[cache[i]] = {
                                user_id: snapshot.id,..._json
                            }
                            console.log("ADDED to cache (notification)", _toCache);
                        }
                        else console.log("COULDNT FIND " + cache[i]);
                        // set users here on last iteration
                        if(i === cache.length - 1)
                        {
                            _setUsers( {..._users, ..._toCache});
                            //console.log("members context set!", _toCache);
                        }
                    }).catch((error) => {alert(error)});
                }
            }
        }
    }
    useEffect(() => {
        if(hasCached) check_cache();
    }, [hasCached]);
    useEffect(() => {
        if(cache.length > 0 && hasCached)
        {
            check_cache();
        }
    }, [cache]);
    useEffect(() => {
        if(notifs !== undefined)
        {
            setNotifCount(notifs.length);
            var _toCache = [];
            notifs.forEach((s) => {
                console.log("notif",s);
                if(s.type === "buddy" && _users[s.id] === undefined && !cache.includes(s.id) && !_toCache.includes(s.id))
                {
                    _toCache.push(s.id);
                }
            });
            if(_toCache.length > 0)
            {
                setCache(cache.concat(_toCache));
            }
        }
    }, [notifs]);
    function toggle_notif_nest()
    {
        if(notifNest.current.style.display === "flex")
        {
            notifNest.current.style.display = "none";
        }
        else
        {
            notifNest.current.style.display = "flex";
            if(!hasCached) setHasCached(true);
        }
    }
    return (
        <div className="teaBar">
            <div className="welcomer" style={{position:null}}>
                <div className="chattea" 
                        style={{transform:currentUser? "translateX(0)" : "translateX(-50%)",
                            left:currentUser?"0":"50%"}}>
                    <p className="teaPrefix" style={{maxWidth:currentUser ? "0" : "100%"}}>Get</p>
                    <div style={{gap:"10px"}}>
                        <Link to={currentUser?"/main":"/"}><div style={{backgroundImage:"url('/tea.png')"}}></div></Link>
                        <p>Chat<span>tea</span></p>
                    </div>
                    <p style={{opacity:currentUser ? "0" : "1"}}>with people!</p>
                </div>
                <WelcomeBanner notifEvent={toggle_notif_nest} notifCount={notifCount} pfp={_user !== undefined ? _user["pfp"] : ""}/>
            </div>
            <div ref={notifNest} className="notifNest" style={{display:"none"}}>

                {(notifs === undefined || notifs.length === 0) ?
                    <NotificationChild msg="You have no notifications" info={{}}placeholder={true} onClick={toggle_notif_nest}/> :

                    notifs.map((n) => {
                        return <NotificationChild key={n.id} info={n} user={_user.user_id} onClick={toggle_notif_nest}/>
                    })
                }
            </div>
            <Signup/>
        </div>
    )
}
export default TeaBar;