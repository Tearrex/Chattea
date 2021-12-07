import { ref, doc, deleteDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, _dbRef } from "./firebase";
import { MembersContext } from "./Contexts";

function NotificationChild (props)
{
    const {_users, _setUsers} = useContext(MembersContext);
    const navigate = useNavigate();
    const {date, origin, id, type} = props.info;
    const currentUser = useAuth();
    const [icon, setIcon] = useState("❕");
    const [message, setMessage] = useState("");
    useEffect(() => {
        if(type === "comment")
        {
            setIcon("💬"); setMessage("Your post has new comments");
        }
        else if(type === "buddy")
        {
            setIcon("");
            if(_users[id] !== undefined) setMessage("made you their buddy");
        }
    }, [type, _users]);
    async function delete_notif()
    {
        var postRef = doc(_dbRef, "users/"+props.user+"/notifications/"+id);
        await deleteDoc(postRef);
    }
    //console.log(props.info);
    function notif_interact()
    {
        if (props.onClick !== undefined) props.onClick();
        if (props.placeholder === true) return;
        if(type === "comment") navigate("post/"+id);
        else navigate("profile/"+id);
        delete_notif();
    }
    return (
        <div className="notification">
            <div className="nBody stealthBtn" onClick={notif_interact}>
                <div>{icon !== "" ? <span>{icon}</span> : null}
                {(type === "buddy" && _users[id] !== undefined) ?
                <div className="userBadge">
                    <div style={{backgroundImage:"url("+_users[id].pfp+")"}}/>
                    <span>{_users[id].username}</span>
                </div>    
                : null}
                <p>{props.placeholder === true ? props.msg : message}</p></div>
            </div>
            {props.placeholder === true ? null :
            <button className="nDelete stealthBtn" onClick={delete_notif}>❌</button>
            }
        </div>
    )
}
export default NotificationChild;