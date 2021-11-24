import { doc, getDoc } from "@firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { _dbRef } from "../firebase";
import MediaPost from "../MediaPost";
import { MembersContext, UserContext } from "../UserContext";

function BriefPost()
{
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const [post, setPost] = useState(null);
    const {post_id} = useParams();
    useEffect(() => {
        if(post_id !== undefined)
        {
            console.log("focused post: " + post_id);
            const _doc = doc(_dbRef, "posts/"+post_id);
            const _query = getDoc(_doc).then((s) => {
                if(s.exists())
                {
                    var _data = s.data();
                    setPost(_data);
                }
            });
        }
    }, [post_id]);
    useEffect(() => {
        if(post !== null && _user !== undefined && _user !== null)
        {
            if(post.user_id !== _user.user_id && _users[post.user_id] === undefined)
            {
                // fetch profile data
                const _doc = doc(_dbRef, "users/"+post.user_id);
                const _query = getDoc(_doc).then((s) => {
                    if(s.exists())
                    {
                        console.log("added user", s.data());
                        _setUsers({..._users, [post.user_id]: s.data()});
                    }
                });
            }
        }
    }, [post, _user]);
    return (
        //clamp(400px, 100%, 600px)
        <div className="postPage">
            {(post === null || _user === undefined) ?
            <div className="postNotFound">
                <h1 style={{color:"#fff", fontWeight:"normal"}}>🤔 That post does not exist!</h1>
                <button onClick={(e) => navigate("/main")}>Go back home</button>
            </div> :
            <MediaPost onDelete={(e) => navigate("/main")} replaceImg={true} postID={post_id} msg={post} authorID={post.user_id}/>
            }
        </div>
    )
}
export default BriefPost;