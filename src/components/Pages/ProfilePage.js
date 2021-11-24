import { useContext, useEffect, useState, useRef } from "react";
import MediaFeed from "../MediaFeed";
import { MembersContext, UserContext } from "../UserContext";
import { updateDoc, doc } from "firebase/firestore";
import { useAuth, _storageRef, _dbRef } from "../firebase";
import { uploadBytesResumable, ref, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router";
function ProfilePage(props) {
    const { _user, _setUser } = useContext(UserContext);
    const { _users, _setUsers } = useContext(MembersContext);
    const [focus, setFocus] = useState(null);
    const {user_id} = useParams();
    const [canSave, setSave] = useState(false);
    const [uploading, setUploading] = useState(false);
    //profile picture
    const [userPfp, setUserPfp] = useState("default_user.png");
    const [pfpFile, setPfpFile] = useState(null);
    const [origPfp, setOrigPfp] = useState("");
    const [pfpSaved, setPfpSaved] = useState(false);
    // banner
    const [userBanner, setBanner] = useState("");
    const [bannerFile, setBannerFile] = useState(null);
    const [origBanner, setOrigBanner] = useState("");
    const [bannerSaved, setBannerSaved] = useState(false);
    // name
    const [inputName, setName] = useState("");
    const [bioText, setBio] = useState("");
    const [origBio, setOrigBio] = useState("");
    const [joinDate, setJoinDate] = useState("");
    const nameCharLimit = 20;
    const bioCharLimit = 150;

    useEffect(() => {
        if(_user !== undefined || _users[user_id] !== undefined)
        {
            if (_user !== undefined && user_id === _user.user_id) {
                var __user = _user;
                //console.log("User's profile", __user);
                setName(__user.username);
                setUserPfp(__user.pfp);
                setOrigPfp(__user.pfp);
                //setFocus(__user.user_id);
                setBio(__user.about);
                setOrigBio(__user.about);
                setJoinDate(__user.joined);
                if (__user.banner !== "") {
                    setBanner(__user.banner); setOrigBanner(__user.banner);
                }
            }
            else if (user_id !== undefined && _users[user_id] !== undefined)
            {
                var __user = _users[user_id];
                console.log("Author's profile", __user);
                setName(__user.username);
                setUserPfp(__user.pfp);
                setOrigPfp(__user.pfp);
                //setFocus(__user.user_id);
                setBio(__user.about);
                setOrigBio(__user.about);
                setJoinDate(__user.joined);
                if (__user.banner !== "") {
                    setBanner(__user.banner); setOrigBanner(__user.banner);
                }
            }
        }
    }, [_user, _users]);
    const profileCard = useRef();
    const bannerChanger = useRef();
    const pfpChanger = useRef();
    useEffect(() => {
        console.log("PASSED ID HEREE ->>>", user_id);
        if(_user !== undefined) profile_cleanup();
    }, [user_id, _user]);
    function profile_cleanup()
    {
        console.log("cleanup called!");
        var inputs = profileCard.current.getElementsByTagName("input");
        //console.log("fetched inputs", inputs);
        var isUserSelf = (user_id === _user.user_id);
        //console.log("user is self?", isUserSelf);
        for(let i = 0; i < inputs.length; i++)
        {
            inputs[i].disabled = !isUserSelf;
        }
        if(isUserSelf === true)
        {
            bannerChanger.current.style.opacity = null;
            pfpChanger.current.style.display = "block";
        }
        else
        {
            bannerChanger.current.style.opacity = "0";
            pfpChanger.current.style.display = "none";
        }
        if (_user !== undefined && user_id === _user.user_id) {
            var __user = _user;
            //console.log("User's profile", __user);
            setName(__user.username);
            setUserPfp(__user.pfp);
            setOrigPfp(__user.pfp);
            //setFocus(__user.user_id);
            setBio(__user.about);
            setOrigBio(__user.about);
            setJoinDate(__user.joined);
            if (__user.banner !== "") {
                setBanner(__user.banner); setOrigBanner(__user.banner);
            }
        }
        else if (user_id !== undefined && _users[user_id] !== undefined)
        {
            var __user = _users[user_id];
            console.log("Author's profile", __user);
            setName(__user.username);
            setUserPfp(__user.pfp);
            setOrigPfp(__user.pfp);
            //setFocus(__user.user_id);
            setBio(__user.about);
            setOrigBio(__user.about);
            setJoinDate(__user.joined);
            if (__user.banner !== "") {
                setBanner(__user.banner); setOrigBanner(__user.banner);
            }
            else
            {
                setBanner("");
            }
        }
    }
    function change_name(e) {
        if (e.target.value.length > nameCharLimit) return;
        setName(e.target.value);
    }
    function change_bio(e) {
        if (e.target.value.length > bioCharLimit) return;
        setBio(e.target.value);
    }
    const usernameField = useRef();
    const [_msg, changeMsg] = useState("");
    const updateMessage = useRef();

    const saveOptions = useRef();
    useEffect(() => {
        if (inputName === "") {
            usernameField.current.style.border = "3px solid #f00";
            setSave(false);
            changeMsg("Name missing!");
        }
        else {
            usernameField.current.style.border = null;
            //changeMsg();
            if (inputName !== _user.username && user_id === _user.user_id) setSave(true);
            else {
                if (userPfp === origPfp) setSave(false);
            }
        }
    }, [inputName]);
    useEffect(() => {
        if(bioText === origBio)
        {
            setSave(false);
        }
        else
        {
            setSave(true);
        }

    }, [bioText]);
    function update_pfp(e) {
        console.log("pfp changed!");
        console.log(e.target.files[0]);
        setSave(true);
        setPfpFile(e.target.files[0]);
        setUserPfp(URL.createObjectURL(e.target.files[0]));
    }
    function update_banner(e) {
        console.log("banner changed!");
        console.log(e.target.files[0]);
        setSave(true);
        setBannerFile(e.target.files[0]);
        setBanner(URL.createObjectURL(e.target.files[0]));
    }
    function revert_changes() {
        setName(_user.username);
        setUserPfp(origPfp);
        setPfpFile(null);
        setBanner(origBanner);
        setBannerFile(null);
        setSave(false);
        setBio(origBio);
        inputRef.current.value = null;
        //closePopup();
    }
    function submit_changes() {
        if (canSave === false || uploading === true) return;
        if (userPfp !== origPfp) {
            // upload new pfp
            console.log("uploading profile picture");
            setUploading(true);
            const _ref = ref(_storageRef, "profiles/" + _user["user_id"] + "/"+ _user["user_id"]);
            const task = uploadBytesResumable(_ref, pfpFile);
            task.on('state_changed',
                (s) => {
                    const progress = (s.bytesTransferred / s.totalBytes) * 100;
                    changeMsg(String(Math.round(progress)) + "%");
                },
                (error) => {
                    changeMsg("FAILED!");
                    console.log(error);
                },
                () => {
                    getDownloadURL(task.snapshot.ref).then((downloadURL) => {
                        console.log('File available at', downloadURL);
                        setUserPfp(downloadURL);
                        setPfpSaved(true);
                        //changesRef = {...changesRef, pfp:downloadURL};
                    });
                }
            );
        } else setPfpSaved(true);
        if (userBanner !== origBanner) {
            // upload new banner
            console.log("uploading banner");
            setUploading(true);
            const _ref = ref(_storageRef, "banners/" + _user["user_id"] + "/" + bannerFile.name);
            const task = uploadBytesResumable(_ref, bannerFile);
            task.on('state_changed',
                (s) => {
                    const progress = (s.bytesTransferred / s.totalBytes) * 100;
                    changeMsg(String(Math.round(progress)) + "%");
                },
                (error) => {
                    changeMsg("FAILED!");
                    console.log(error);
                },
                () => {
                    getDownloadURL(task.snapshot.ref).then((downloadURL) => {
                        console.log('File available at', downloadURL);
                        setBanner(downloadURL);
                        // ^ it should stick with the user's local file to save bandwidth
                        // change this later
                        setBannerSaved(true);
                    });
                }
            );
        }
        else setBannerSaved(true);

        //setPfpFile(null);
        changeMsg("");
        //console.log("set new pfp " + changesRef["pfp"]);
        setSave(false); setUploading(false);
    }
    useEffect(() => {
        if(bannerSaved === true && pfpSaved === true)
        {
            var changesRef = {}
            if(inputName !== _user.username && inputName !== "")
            {
                changesRef["username"] = inputName;
            }
            if(userPfp !== origPfp)
            {
                setUserPfp(userPfp); setOrigPfp(userPfp);
                changesRef["pfp"] = userPfp;
            }
            if(userBanner !== origBanner)
            {
                setOrigBanner(userBanner);
                changesRef["banner"] = userBanner;
            }
            if(bioText !== origBio)
            {
                setOrigBio(bioText);
                changesRef["about"] = bioText;
            }
            const docRef = doc(_dbRef, "users", _user["user_id"]);
            updateDoc(docRef, changesRef);
            console.log("changes",changesRef);
            //setOrigName(inputName);
            _setUser({ ..._user, ...changesRef });
            setBannerSaved(false); setPfpSaved(false);
            setSave(false); setUploading(false);
        }
    }, [bannerSaved, pfpSaved]);
    useEffect(() => {
        if (canSave === true) {
            saveOptions.current.style.display = "flex";
        }
        else {
            if(uploading === false)saveOptions.current.style.display = "none";
        }
    }, [canSave]);
    useEffect(() => {
        if(uploading === false)saveOptions.current.style.display = "none";
    }, [uploading]);
    const inputRef = useRef();
    const bannerRef = useRef();
    return (
        <div className="homeWrapper">
            <div id="home">
                <div ref={profileCard} className="mainProfile" id="mainProfile" style={{ width: "100%" }}>
                    <div className="niceClip" style={{ backgroundImage: "url('"+ userBanner +"')",position:"relative"}}>
                        <label ref={bannerChanger} className="bannerBtn niceClip" style={{ backgroundImage: "url('/cam_icon.svg')", borderRadius: "0" }}>
                            <input ref={bannerRef} type="file" accept=".jpg, .png" onChange={update_banner} />
                        </label>
                        <div className="primaryInfo profileMod">
                            <div className="pfpNest">
                                <label ref={pfpChanger} style={{ backgroundImage: "url('/cam_icon.svg')", borderRadius: "0" }}>
                                    <input ref={inputRef} type="file" accept=".jpg, .png" onChange={update_pfp} />
                                </label>
                                <div style={{ backgroundImage: "url(" + userPfp + ")", borderRadius: "0" }} className="profilePic" />
                            </div>
                            <div className="nameField">
                                <input ref={usernameField} type="text" value={inputName} onChange={(e) => change_name(e)} />
                                <p className="charCount">{inputName ? inputName.length : "0"}/{nameCharLimit}</p>
                            </div>
                        </div>
                    </div>
                    <div className="aboutSection">
                        {/**<textarea rows="3" cols="60"
                            placeholder={user_id === _user["user_id"] ? "Brief description about you...":"No description"}
                                onChange={(e) => change_bio(e)} value={bioText} maxLength="150"></textarea> */}
                        <input className="userBio" type='text' value={bioText}
                            placeholder={(_user !== undefined && user_id === _user["user_id"]) ? "Brief description about you...":"No description"} onChange={(e) => change_bio(e)}/>
                    </div>
                    {/**<p className="profileMsg" ref={updateMessage} style={{display:_msg ? "block" : "none", color:_msg?_msg[1]:"#FFF"}}>
                            {_msg ? _msg[0] : null}</p> */}
                    <div ref={saveOptions} className="actions">
                        <button onClick={submit_changes} style={{backgroundColor:"#3498DB"}}>{!uploading ? "Save" : "Uploading..."}</button>
                        <button onClick={revert_changes}>{!uploading ? "Cancel" : _msg}</button>
                    </div>
                    <div className="userInfo">
                        <p>Joined <span>{joinDate}</span></p>
                    </div>
                </div>
                <MediaFeed focus={user_id} />
            </div>
        </div>
    )
}
export default ProfilePage;