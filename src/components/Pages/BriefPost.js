import { doc, getDoc } from "@firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { _dbRef } from "../Main/firebase";
import MediaPost from "../Media/MediaPost";
import { MembersContext, UserContext } from "../Main/Contexts";

function BriefPost()
{
    const navigate = useNavigate();
    const [cache, setCache] = useState([]);
    useEffect(() => {
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
                            var _json = {user_id: snapshot.id, ...snapshot.data()};
                            _toCache[cache[i]] = _json;
                            console.log("ADDED to cache (buddy list)", _json);
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
    }, [cache]);
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
        if(post !== null)
        {
            if((!_user || _user.user_id !== post.user_id) && !_users[post.user_id])
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
    }, [post]);
    function send_commenters_to_cache(commenters)
    {
        var _cache = [];
        for(let i = 0; i < commenters.length; i++)
        {
            if(commenters[i] !== _user.user_id && !cache.includes(commenters[i]) && _users[commenters[i]] === undefined)
            {
                _cache.push(commenters[i]);
            }
        }
        if(_cache.length > 0) setCache([...cache, ..._cache]);
    }
    return (
        //clamp(400px, 100%, 600px)
        <div className="postPage">
            {(post === null) ?
            <div className="postNotFound">
                <h1 style={{color:"#fff", fontWeight:"normal"}}>🤔 That post does not exist!</h1>
                <button onClick={(e) => navigate("/main")}>Go back home</button>
            </div> :
            <MediaPost onDelete={(e) => navigate("/main")} replaceImg={true}
                postID={post_id} msg={post} authorID={post.user_id} toCache={(e) => send_commenters_to_cache(e)}/>
            }
        </div>
    )
}
export default BriefPost;