import { useDocumentData } from 'react-firebase-hooks/firestore';
import { getDoc, doc, arrayUnion, arrayRemove, updateDoc, deleteDoc, query } from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import { _dbRef } from './firebase';
import { UserContext } from './Contexts';
function SmileCounter(props)
{
    const [_smiles, setSmiles] = useState(-1);//props.smiles;
    const {_user, _setUser} = useContext(UserContext);
    //doc(_dbRef, "users", user_id);
    //const omg = collection(_dbRef, 'users/' + props.author + '/smiles');
    const _smilesRef = doc(_dbRef, 'users/' + props.authorID + '/smiles/' + props.postID);
    const smiles = useDocumentData(_smilesRef)
    useEffect(() => {
        if(smiles[0] !== undefined)
        {
            var ssmiles = smiles[0]["smiles"];
            setSmiles(ssmiles.length);
        }
    }, [smiles]);
    return (
        <div className="managePost">
            <div className="smileButton">
                <span style={{cursor:"default", border:"none"}}>{_smiles === 0 ? "🙂" : "😃"} {_smiles}</span>
            </div>
        </div>
    )
}   
export default SmileCounter;