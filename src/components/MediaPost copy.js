import { ref, child, get } from 'firebase/database';
import { useEffect, useState } from 'react';
import pfp from './default_user.png'
import { useAuth, dbRef } from './firebase'
import Smiley from './Smiler'
function MediaPost(props)
{
    const currentUser = useAuth();
    const postId = props.content[3];
    const [name, setName] = useState("");
    //console.log(props.content)
    useEffect(() => {
        if (props.content[0] === "")
        {
            setName("UNKNOWN");
            console.log("USER HAS NO EMAIL");
        }
        else
        {
            get(ref(dbRef, 'users/' + props.content[0].replace('.','_'))).then((snapshot) => {
                if (snapshot.exists()) {
                    var _json = snapshot.toJSON();
                    setName(_json["username"]);
                } else {
                    setName("UNKNOWN");
                    console.log("COULDNT FIND " + props.content[0].replace('.','_'));
                }
            }).catch((error) => {
                alert(error);
            });
        }
    }, []);
    return (
        <div className="mediaPost mediaCard">
            <div className="postUserInfo">
                {(currentUser && props.content[0] != currentUser.email) ? <Smiley canSmile="true"/> : <Smiley canSmile="false" postId={postId}/>}
                <div className="userAndPfp">
                    <img src={pfp} alt="PFP"></img>
                    <p>{name}</p>
                </div>
            </div>
            {(props.content[2] === "") ? <p>{props.content[1]}</p> :
            (
                <div>
                    <br/><p style={{display: 'inline-block'}}>{props.content[1]}</p>
                    <br/>
                    <div className="mediaPostImg">
                        <img src={props.content[2]} alt="uploaded"/>
                    </div>
                </div>
            )}
        </div>
    )
}
export default MediaPost