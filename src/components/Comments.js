import { useContext, useRef } from "react";
import Comment from "./Comment";
import { MembersContext, UserContext } from "./UserContext";
import { getDoc, getDocs, doc, where, startAfter, startAt, endAt, endBefore, query, collection, orderBy, limit } from '@firebase/firestore';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { _dbRef } from "./firebase";
import { addDoc, serverTimestamp } from "@firebase/firestore";
async function post_comment(text, postID, user_id)
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
        return true;
    }
    catch (e){console.log(e); return false;}
}
export {post_comment};
function Comments(props)
{
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);

    const _col = collection(_dbRef, 'posts/'+props.postID+"/comments");
    const _query = query(_col, orderBy('date','desc'), limit(5));
    const [_comments] = useCollectionData(_query, {idField: 'id'});
    const textInput = useRef();
    async function post_comment(e)
    {
        e.preventDefault();
        if(String(textInput.current.value).trim() === "") return;
        try
        {
            // now post!
            const docRef = await addDoc(collection(_dbRef, "posts/"+props.postID+"/comments"), {
                content: textInput.current.value,
                date: serverTimestamp(),
                user_id: _user.user_id
            });
            console.log("Added comment " + docRef.id);
            textInput.current.value = "";
        }
        catch (e){console.log(e);}
    }
    function display_comment(comment)
    {
        return (<Comment key={comment.id} comment={comment}/>);
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