import { addDoc, getDoc, collection, query, doc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState, useRef, useContext } from 'react';
//import pfp from './default_user.png';
import { useAuth, dbRef, _dbRef, _storageRef } from './firebase';
import SmileButton from './SmileButton';
import { deleteObject, ref } from "firebase/storage";
import React from 'react';
import { MembersContext, UserContext } from './UserContext';
import Comments, { post_comment } from './Comments';
import { useNavigate } from 'react-router';
function MediaPost(props)
{
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const { caption, content, date, image_url, user_id} = props.msg;
    const [captionInput, setCaption] = useState("");
    const [isAuthor, setAuthor] = useState(false);
    const [postDate, setPostDate] = useState("");
    const postID = props.postID;

    const [pfp, setPfp] = useState("/default_user.png");

    useEffect(() => {
        setCaption(caption)
    }, [caption]);
    useEffect(() => {
        if(date !== null && date !== undefined && postDate === "")
        {
            setPostDate(Intl.DateTimeFormat('en-US', {dateStyle:'medium', timeStyle:'short'})
            .format(date.toDate()).toString());
        }
    }, [date]);
    useEffect(() => {
        //if(_users !== undefined) console.log(_users["members"]);
        //if(currentUser !== undefined && user_id !== undefined && user_id !== null && user_id !== "" && name === "")
        
        if(user_id !== undefined)
        {
            //if(_users[user_id] !== undefined) return;
            if(user_id === _user["user_id"] && user_id !== undefined)
            {
                setPfp(_user["pfp"]);
                setAuthor(true);
                return;
            }
            if (user_id === "")
            {
                console.log("USER HAS NO EMAIL");
            }
            else
            {
                //console.log("USER ID FROM POST: " + user_id);
                //console.log("is this it?");
                if(_users[user_id] !== undefined)
                {
                    var user = _users[user_id];
                    //console.log("user info exists in cache ! " + user.username);
                    var _pfp = user.pfp;
                    var _join = user.join_date;
                    if(_pfp !== "") setPfp(_pfp);
                    return;
                }
            }
        }
    }, [_users, _user]);
    const imageNest = useRef();
    useEffect(() => {
        const abort = new AbortController();
        if(image_url !== undefined && image_url !== "")
        {
            var _oldImage = imageNest.current.getElementsByTagName("img");
            if (_oldImage.length > 0)
            {
                console.log("Replace image is",props.replaceImg);
                if(props.replaceImg !== true)
                {
                    console.log("image already exists!"); return;
                }
                else
                {
                    // doesnt need a for loop, but im planning on
                    // allowing multiple images later on...
                    for(let i = 0; i < _oldImage.length; i++)
                    {
                        imageNest.current.removeChild(_oldImage[i]);
                    }
                }
            }
            console.log("loading post image...");
            var img = new Image();
            img.src = image_url;
            img.id = "richImage"
            img.onload = function() {
                if(abort.signal["aborted"] === true)
                {
                    console.log("image load stopped, not in view");
                    return;
                }
                //console.log("abort signal", abort.signal);
                imageNest.current.appendChild(img);
            };
            //imageNest.current.appendChild(img);
        }
        return () => abort.abort();
    }, [image_url]);
    const deleteOptions = useRef();
    const deleteOverlay = useRef();
    function toggle_options(show)
    {
        console.log("toggle",show);
        if(show === false)
        {
            deleteOptions.current.style.display="none";
            deleteOverlay.current.style.maxWidth="0%";
        }
        else
        {
            deleteOptions.current.style.display="flex";
            deleteOverlay.current.style.maxWidth="100%";
        }
    }
    async function delete_post()
    {
        //console.log("starting delete");
        const postRef = doc(_dbRef, "posts", props.postID);
        await deleteDoc(postRef);
        const smilesRef = doc(_dbRef, 'users/' + props.authorID + '/smiles/' + props.postID);
        await deleteDoc(smilesRef);
        //console.log("deleted?");
        const imgRef = ref(_storageRef, "images/" + props.postID);
        try{await deleteObject(imgRef);}
        catch (e) {console.log(e);}
        props.onDelete();
        console.log("Removed post " + props.postID);
    }
    const commentBox = useRef();
    const commentSub = useRef();
    const textInput = useRef();
    const [comment, setComment] = useState("");
    async function handle_comment(e)
    {
        e.preventDefault();
        var _comment = comment;
        setComment("");
        var result = await post_comment(_comment, postID, _user["user_id"], user_id);
        //if(result === true) textInput.current.value = "";
    }
    function change_comment(e)
    {
        if(e.target.value.length > 100) return;
        setComment(e.target.value);
    }
    useEffect(() => {
        if(comment.trim() === "")
        {
            commentSub.current.style.opacity = "0.5";
            commentSub.current.style.boxShadow = "none";
        }
        else
        {
            commentSub.current.style.opacity = "1";
            commentSub.current.style.boxShadow = null;
        }
    }, [comment]);
    function toggle_textbox()
    {
        setComment("");
        commentBox.current.style.display = "flex";
        textInput.current.focus();
        commentBox.current.style.display = null;
    }
    function send_commenters_to_cache(commenters)
    {
        console.log("received commenters",commenters);
        requestAnimationFrame(() => {
            props.toCache(commenters);
        })
    }
    return (
        <div className="mediaCard" onClick={() => console.log("POST: " + props.postID + " AUTHOR: " + props.authorID)}>
            <div className="postUserInfo" style={{boxShadow:image_url === "" ? "none":null}}>
                <div className="mediaContent">
                    <p style={{marginBottom:0,fontSize:"1.3rem"}}>{content}</p>
                </div>
                <div className="userAndPfp">
                    {isAuthor ? null :
                        <p className="username" style={{display:(user_id === _user["user_id"]) ? "none":"block"}}>
                            {(_users[props.authorID] !== undefined) ? _users[props.authorID].username : "User"}</p>
                    }
                    <div onClick={() => navigate("/profile/" + props.authorID)}>
                        <div style={{backgroundImage:"url("+pfp+")"}} className="profilePicture niceClip" />
                    </div>
                </div>
            </div>
            <div className="mediaSecondary">
                {image_url !== "" ?
                <div ref={imageNest} className="mediaPostImg">
                    <div className="imgOverlay" 
                        style={{opacity:(captionInput !== "" || props.authorID === _user["user_id"]) ? null: "0"}}>
                        <input type="text" placeholder="Add a caption..." value={captionInput}
                            disabled/>
                    </div>
                    {/**<div style={{backgroundImage:"url("+image_url+")"}} /> */}
                </div> : null
                }
                <div style={{zIndex:"1"}}>
                    <div className="postActions">
                        <div ref={deleteOverlay} className="deleteOverlay" style={{maxWidth:"0%"}}/>
                        <div className="actionBundle">
                            {(_user["user_id"] === user_id || _user["role"] === "admin") ?
                            <button className="deletePost stealthBtn" onClick={(e) => toggle_options(true)}>🗑️</button>
                            : null}
                            
                            <SmileButton canSmile={(_user["user_id"] === user_id)
                                ? "false" : "true"} smiled={props.smiled} postID={postID} author={user_id}/>
                        </div>
                        <button className="stealthBtn" onClick={toggle_textbox}>💬 Comment</button>
                    </div>
                    <div ref={deleteOptions} className="actions" style={{flexFlow:"row-reverse", display:"none"}}>
                            <button onClick={delete_post}>Delete</button>
                            <button onClick={(e) => toggle_options(false)}>Cancel</button>
                    </div>
                    <div>
                        <form ref={commentBox} className="commenter" onSubmit={handle_comment}>
                            <input ref={textInput} type="text" value={comment}
                                onChange={(e) => change_comment(e)} placeholder="Type your comment..." />
                            <input ref={commentSub} className="stealthBtn" type="submit" value=""/>
                        </form>
                        <Comments postID={postID} authorID={postID} toCache={(e) => send_commenters_to_cache(e)}/>
                    </div>
                    <span className="timestamp">Posted {postDate}</span>
                </div>
            </div>
        </div>
    )
}
export default MediaPost