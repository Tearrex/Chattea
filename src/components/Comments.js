import Comment from "./Comment";
import { query, collection, orderBy, limit, setDoc, doc, getDoc } from '@firebase/firestore';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { _dbRef } from "./firebase";
import { addDoc, serverTimestamp } from "@firebase/firestore";
import { ref } from "@firebase/storage";
import { useContext, useEffect, useState } from "react";
import { MembersContext, UserContext } from "./UserContext";
async function post_comment(text, postID, user_id, author_id)
{
    if(text.trim() === "") return;
    try
    {
        // now post!
        const docRef = await addDoc(collection(_dbRef, "posts/"+postID+"/comments"), {
            content: text,
            date: serverTimestamp(),
            user_id: user_id
        });
        console.log("Added comment " + docRef.id);
        if(user_id !== author_id)
        {
            // add notification for authot
            //doc(_dbRef, "users/"+ _user.user_id + "/smiles/" + newPost.id)
            const _doc = doc(_dbRef, "users/"+author_id+"/notifications/"+postID);
            try {
                await setDoc(_doc, {
                    type: "comment",
                    date: serverTimestamp()
                });
                console.log("user has been notified!");
            } catch (error) {
                console.log("failed to notify user");
            }
        }
        return true;
    }
    catch (e){console.log(e); return false;}
}
export {post_comment};
function Comments(props)
{
    const _col = collection(_dbRef, 'posts/'+props.postID+"/comments");
    const _query = query(_col, orderBy('date','desc'), limit(5));
    const [_comments] = useCollectionData(_query, {idField: 'id'});
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    
    useEffect(() => {
        if(_comments !== undefined && _comments.length > 0)
        {
            var _cache = [];
            _comments.forEach((c) => {
                if(c.user_id !== _user.user_id && _users[c.user_id] === undefined && !_cache.includes(c.user_id))
                {
                    _cache.push(c.user_id);
                }
            });
            if(_cache.length > 0)
            {
                requestAnimationFrame(() => {
                    props.toCache(_cache);
                });
            }
        }
    }, [_comments]);
    function display_comment(comment)
    {
        return (<Comment key={comment.id} comment={comment} postID={props.postID}/>);
    }
    return (
        <div className="commentSection">
            {(typeof(_comments) === 'undefined') ? (<p>Please wait</p>) : (
                _comments.map((comment) => 
                display_comment(comment))
            )}
        </div>
    )
}
export default Comments;