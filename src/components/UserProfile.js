import { useContext, useEffect, useRef, useState } from "react";
import { useAuth, _storageRef, _dbRef } from "./firebase";
import { updateDoc, doc } from "firebase/firestore";
import { uploadBytesResumable, ref, getDownloadURL } from "firebase/storage";
import { MembersContext, UserContext } from "./UserContext";
import { Link } from "react-router-dom";
function UserProfile(props)
{   
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const overlay = useRef();
    const [userPfp, setUserPfp] = useState("default_user.png");
    const [pfpFile, setPfpFile] = useState(null);
    const [origPfp, setOrigPfp] = useState("");
    const [inputName, setName] = useState("");
    const nameCharLimit = 20;
    useEffect(() => {
        if(_user["username"] !== undefined) setName(_user["username"]);
    }, [_user]);
    useEffect(() => {
        if(props._user === true && _user["username"] !== undefined)
        {
            //console.log("set cur user yesssssss");
            //console.log(_user);
            setName(_user["username"]);
            setUserPfp(_user["pfp"]);
            setOrigPfp(_user["pfp"]);
        }
        //else console.log("nonsense");
    }, [props._user]);
    useEffect(() => {
        if(props.name !== undefined && props._user === undefined) setName(props.name);
    }, [props.name]);
    useEffect(() => {
        if(props.pfp !== "" && props.pfp !== undefined)
        {
            setUserPfp(props.pfp);
            setOrigPfp(props.pfp);
        }
    }, [props.pfp]);
    return (
        <Link to={"/profile/" + props.uid}>
            <div>
                {/*<img src={userPfp} alt="PFP" className="profilePicture" onClick={show}></img>*/}
                <div style={{backgroundImage:"url("+(props.uid !== _user["user_id"] ? userPfp : _user["pfp"])+")",
                    borderRadius:(props.uid === _user["user_id"] ? "0": null)}}
                    className="profilePicture niceClip"></div>
            </div>
        </Link>
    )

}
export default UserProfile