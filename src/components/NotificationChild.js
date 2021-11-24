import { ref, doc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, _dbRef } from "./firebase";

function NotificationChild (props)
{
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
        else if(type === "buddy") setIcon("👥");
    }, [type]);
    async function delete_notif()
    {
        var postRef = doc(_dbRef, "users/"+props.user+"/notifications/"+id);
        await deleteDoc(postRef);
    }
    //console.log(props.info);
    function notif_interact()
    {
        if (props.placeholder === true) return;
        props.onClick();
        navigate("post/"+id); delete_notif();
    }
    return (
        <div className="notification">
            <div className="nBody stealthBtn" onClick={notif_interact}>
                <p><span>{icon}</span>{props.placeholder === true ? props.msg : message}</p>
            </div>
            {props.placeholder === true ? null :
            <button className="nDelete stealthBtn" onClick={delete_notif}>❌</button>
            }
        </div>
    )
}
export default NotificationChild;