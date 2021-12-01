import { useContext, useState, useEffect } from "react";
import { MembersContext, UserContext } from "./UserContext";
import { Link } from "react-router-dom";
import { deleteDoc, doc } from "@firebase/firestore";
import { _dbRef } from "./firebase";
import { useNavigate } from "react-router";
function Comment(props)
{
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const {date, content, user_id, id} = props.comment;

    const [pfp, setPfp] = useState("/default_user.png");
    const [username, setUsername] = useState("LOADING");
    useEffect(() => {
        if(user_id === _user["user_id"])
        {
            setPfp(_user.pfp);
            setUsername(_user.username);
        }
        else if(_users[user_id] !== undefined)
        {
            setPfp(_users[user_id].pfp);
            setUsername(_users[user_id].username);
        }
    }, [_users, _user]);
    async function delete_comment()
    {
        console.log(props.postID + " comment id: " + id);
        const commentRef = doc(_dbRef, "posts/"+props.postID+"/comments/"+id);
        await deleteDoc(commentRef);
    }
    function visit_user()
    {
        navigate("/profile/" + user_id);
    }
    return (
        <div className="comment">
            {(_user !== undefined && _user.role === "admin") ?
            <span className="cDelete" onClick={delete_comment}>🗑️</span> : null}
            <span className="cUser" onClick={visit_user}>{username}</span> said <span className="content">{content}</span>
        </div>
    )
}
export default Comment;