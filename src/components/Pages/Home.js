import MediaFeed from "../Media/MediaFeed";
import Scroller from "../Scroller";
import Submitter from "../Media/Submitter";
import { Timestamp, addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { useAuth, _dbRef } from "../Main/firebase";
import { useContext } from "react";
import { UserContext } from "../Main/Contexts";
function Home()
{
    const {_user, _setUser} = useContext(UserContext);
    async function postMessage(_content, imgFunc=null)
    {
        //console.log("the creature speaks " + content);
        /*var id = Math.random().toString(16).slice(2);
        var pid = currentUser.email.split('@')[0] + id;
        set(ref(dbRef, 'posts/' + pid), {
        user: currentUser.email,
        content: content,
        img: "",
        smiles:"",
        date: new Date().toLocaleString()
        });*/
        try
        {
            // now post!
            const docRef = await addDoc(collection(_dbRef, "posts"), {
                content: _content,
                date: Timestamp.now(),
                image_url: "",
                //smiles: [],
                user_id: _user.user_id
            });
            //'users/' + props.author + '/smiles/' + _postID
            await setDoc(doc(_dbRef, "users/"+ _user.user_id + "/smiles/" + docRef.id), {smiles:[]});
            console.log("Created post " + docRef.id);
            if (imgFunc !== null)
            {
                //start uploading user file, after we obtain the created post ID
                imgFunc(docRef.id);
            }
        }
        catch (e){console.log(e);}
    }
    return (
        <div className="homeWrapper">
            <div id="home" className="clamper">
                <Submitter onMessageSend={postMessage}/>
                <MediaFeed />
            </div>
        </div>
    )
}
export default Home;