import { useContext, useState, useEffect } from "react";
import { MembersContext, UserContext } from "./UserContext";
import { Link } from "react-router-dom";
function Comment(props)
{
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const {date, content, user_id} = props.comment;

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
    return (
        <div className="comment">
            <Link to={"/profile/" + user_id}><span>{username}</span></Link> said <span className="content">{content}</span>
        </div>
    )
}
export default Comment;