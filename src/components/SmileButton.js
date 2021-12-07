import { useContext, useEffect, useRef, useState } from "react";
import { getDoc, doc, arrayUnion, arrayRemove, updateDoc, deleteDoc, query } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useAuth, _dbRef, _storageRef } from './firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { UserContext } from "./Contexts";
import { collection } from "@firebase/firestore";
import SmileCounter from "./SmileCounter";

function SmileButton(props)
{
    const {_user, _setUser} = useContext(UserContext);
    const [smiled, didSmile] = useState(false);
    const _postID = props.postID;
    async function postSmile(remove)
    {
        const docRef = doc(_dbRef, 'users/' + props.author + '/smiles/' + _postID);
        const query = await getDoc(docRef);
        if(query.exists())
        {
            if(remove === false)
            {
                await updateDoc(docRef, {
                    smiles: arrayUnion(_user["user_id"])
                });
                didSmile(true);
                console.log("smiled :) " + _postID);
            }
            else
            {
                await updateDoc(docRef, {
                    smiles: arrayRemove(_user["user_id"])
                });
                didSmile(false);
                console.log("removed smile :( " + _postID);
            }
        }
        else console.log("no doc found for " + _postID);
    }
    const _smilesRef = doc(_dbRef, 'users/' + props.author + '/smiles/' + props.postID);
    useEffect(() => {
        if(_user !== undefined && props.author !== _user["user_id"])
        {
            //console.log(props.canSmile);
            const _doc = getDoc(_smilesRef).then((s) => {
                var _data = s.data();
                //console.log("smile data", _data["smiles"]);
                if(_data["smiles"].includes(_user["user_id"])) didSmile(true);
            });
        }
    }, [_user]);
    function smile()
    {
        //console.log(check.current.checked);
        postSmile(check.current.checked !== true);
    }

    const check = useRef();
    useEffect(() => {
        if(props.author !== _user["user_id"] && check.current !== undefined)
        {
            check.current.checked = smiled;
        }
    }, [smiled]);
    if(props.canSmile === "true")
    {
        return (
            <label className="smileButton" style={{flex:smiled ? "10%" : "50%"}}>
                <input ref={check} type="checkbox" onClick={smile}/>
                <span className="smile stealthBtn">{smiled ? "😊" : "🙂 Smile"}</span>
                {/**<span>{smiled ? "😊" : "🙂"}</span> */}
            </label>
        )
    }
    else
    {
        return <SmileCounter postID={_postID} authorID={props.author}/>
    }
}

export default SmileButton