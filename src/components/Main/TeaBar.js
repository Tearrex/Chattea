//import { Link } from "react-router-dom";
import { useAuth, _dbRef } from "./firebase";
import UserPanel from "./UserPanel";
import Signup from "./Signup";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { MembersContext, UserContext } from "./Contexts";
import NotificationChild from "../NotificationChild";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, getDoc, limit, orderBy, query, doc } from "@firebase/firestore";
function TeaBar ()
{
    const navigate = useNavigate(); const location = useLocation();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const currentUser = useAuth();

    const _col = collection(_dbRef, 'users/'+(_user ? _user["user_id"] : "n")+"/notifications");
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
                if(_users[cache[i]] === undefined && (!_user || cache[i] !== _user.user_id))
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
    // called when the teacup is clicked from the navigation bar
    function tea_click()
    {
        if(location.pathname === "/main" && currentUser)
        {
            // scroll to the top on the main page
            document.getElementById("subPop").scrollIntoView({behavior:"smooth", block:"end"});
        }
        document.body.style.overflow = null; 
        window.scrollTo(0, 0);
        navigate(currentUser ? "/main" : "/")
    }
    return (
			<div className="teaBar persistor">
				<div className="welcomer" style={{ position: null }} id="welcomer">
					<div
						className="chattea"
					>
						<div style={{ gap: "10px" }}>
							<div
								onClick={tea_click}
								style={{ backgroundImage: "url('/tea.png')" }}
							></div>
							<p className="tea">
								Chat<span>tea</span>
							</p>
						</div>
					</div>
					<UserPanel
						notifEvent={toggle_notif_nest}
						notifCount={notifCount}
						pfp={_user !== undefined ? _user["pfp"] : ""}
					/>
				</div>
				<div ref={notifNest} className="notifNest" style={{ display: "none" }}>
					{notifs &&
						notifs.length > 0 &&
						notifs.map((n) => {
							return (
								<NotificationChild
									key={n.id}
									info={n}
									user={_user && _user.user_id || ""}
									onClick={toggle_notif_nest}
								/>
							);
						})}
				</div>
			</div>
		);
}
export default TeaBar;