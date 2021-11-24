//import { Link } from "react-router-dom";
import { useAuth, _dbRef } from "./firebase";
import WelcomeBanner from "./WelcomeBanner";
import Signup from "./Signup";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "./UserContext";
import NotificationChild from "./NotificationChild";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, limit, orderBy, query } from "@firebase/firestore";
function TeaBar ()
{
    const {_user, _setUser} = useContext(UserContext);
    const currentUser = useAuth();

    const _col = collection(_dbRef, 'users/'+(_user !== undefined ? _user["user_id"] : "n")+"/notifications");
    const _query = query(_col, orderBy('date','desc'));
    const [notifs] = useCollectionData(_query, {idField: 'id'});
    const [notifCount, setNotifCount] = useState(0);
    const notifNest = useRef();
    useEffect(() => {
        if(notifs !== undefined)
        {
            setNotifCount(notifs.length);
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
                    <NotificationChild msg="You have no notifications" info={{}}placeholder={true}/> :

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