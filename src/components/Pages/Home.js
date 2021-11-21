import MediaFeed from "../MediaFeed";
import Scroller from "../Scroller";
import Submitter from "../Submitter";
import WelcomeBanner from "../WelcomeBanner";
import { Timestamp, addDoc, getDoc, getDocs, collection, orderBy, query, limit, serverTimestamp, doc, where, setDoc } from 'firebase/firestore'
import { _dbRef } from "../firebase";
import { useContext } from "react";
import { UserContext } from "../UserContext";
import { useNavigate } from "react-router";
function Home()
{
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    useEffect(() => {
        if(_user === undefined) navigate("/");
    }, [_user]);
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
            <div id="home">
                <Submitter onMessageSend={postMessage}/>
                <MediaFeed />
            </div>
        </div>
    )
}
export default Home;