//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { useContext, useEffect, useRef, useState } from 'react';
import { useAuth, _storageRef, _dbRef } from './firebase'
import { uploadBytesResumable, ref, getDownloadURL } from "firebase/storage"
import { doc, updateDoc } from "firebase/firestore";
import { UserContext } from './UserContext';
import { Timestamp, addDoc, setDoc, collection } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
//import axios from 'axios';
function Submitter(props)
{
    const {_user, _setUser} = useContext(UserContext);
    const currentUser = useAuth();
    const [file, setFile] = useState(null);
    const [localFile, setLocalFile] = useState(null);

    const subWarning = useRef();
    function onFileChange (e)
    {
        fileNest.current.style.maxHeight = "100%";
        setFile(e.target.files[0]); setLocalFile(e.target.files[0]);
    }
    const [imageSize, setImageSize] = useState(0);
    useEffect(() => {
        if(localFile !== null && localFile.size >= 2000000)
        {
            subWarning.current.style.display = "flex";
            setImageSize((localFile.size / 1000000).toFixed(1));
        }
        else
        {
            subWarning.current.style.display = "none";
            setImageSize(0);
        }
    }, [localFile]);
    function remove_image()
    {
        //console.log("remove damni!");
        setCaption("");
        imageField.current.value = null;
        setFile(null); setLocalFile(null);
        //fileNest.current.style.transform = "scale(0)";
        fileNest.current.style.maxHeight = "0";
    }
    const fileNest = useRef();
    const image = useRef();
    const imageField = useRef();

    const _progress = useRef();
    const [uploading, setUploading] = useState(false);
    const _textInput = useRef();
    const [_text, _setText] = useState("");
    const subButton = useRef();
    function change_text(e)
    {
        if(e.target.value.length > 100) return;
        _setText(e.target.value);
    }
    const [caption, setCaption] = useState("");
    function change_caption(e)
    {
        if(e.target.value.length > 45) return;
        setCaption(e.target.value);
    }
    const [canSave, setSave] = useState(false);

    const [compressing, setCompressing] = useState(false);
    const compProgress = useRef();
    async function compress_image(_file)
    {
        const _options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
            onProgress: (p) => {
                compProgress.current.style.maxWidth = "" + p + "%";
            }
        };
        try
        {
            setCompressing(true);
            const compressed = await imageCompression(_file, _options);
            console.log(`compressedFile size ${compressed.size / 1024 / 1024} MB`);
            setImageSize((compressed.size / 1000000).toFixed(1));
            return compressed;
        }
        catch (e)
        {
            console.log(e);
            setCompressing(false);
            return false;
        }
    }
    async function postMessage (e)
    {
        e.preventDefault();
        if(!currentUser || canSave === false) return;
        if (_text.trim() === "" && file === null) return;
        //_setText("");
        const newPost = doc(collection(_dbRef, "posts"));
        var _content = _text;
        var _author = _user.user_id;
        var _caption = caption;
        if(file !== null)
        {
            setUploading(true);
            console.log("starting upload for PID: " + newPost.id);
            var _file = null;
            if(file.size > 2000000) _file = await compress_image(file);
            else _file = file;
            const _ref = ref(_storageRef, "images/" + _author + "/" + newPost.id);
            if(_file === false)
            {
                alert("compression process failed!");
                return;
            }
            const task = uploadBytesResumable(_ref, _file);
            task.on('state_changed',
                (s) => {
                    const progress = (s.bytesTransferred / s.totalBytes) * 100;
                    _progress.current.style.maxWidth = "" + progress + "%";
                },
                (error) => {
                    alert(error);
                },
                () => {
                    getDownloadURL(task.snapshot.ref).then((downloadURL) => {
                        console.log(downloadURL);
                        setDoc(newPost, {
                            content: _content,
                            date: Timestamp.now(),
                            image_url: downloadURL,
                            user_id: _author,
                            caption:_caption
                        });
                        setDoc(doc(_dbRef, "users/"+ _user.user_id + "/smiles/" + newPost.id), {smiles:[]});
                        remove_image();
                        setUploading(false);
                        console.log("Post upload succesful!");
                    });
                }
            );
        }
        else
        {
            try
            {
                const docRef = await addDoc(collection(_dbRef, "posts"), {
                    content: _content,
                    date: Timestamp.now(),
                    image_url: "",
                    caption:"",
                    user_id: _user.user_id
                });
                await setDoc(doc(_dbRef, "users/"+ _user.user_id + "/smiles/" + docRef.id), {smiles:[]});
                console.log("Created post " + docRef.id);
            }
            catch (e){console.log(e);}
        }
        _setText("");
    }
    useEffect(() => {
        if(_text.trim() === "" && localFile === null) setSave(false);
        else setSave(true);
    }, [_text, localFile]);
    useEffect(() => {
        if(!canSave)
        {
            subButton.current.style.opacity = "0.5";
            subButton.current.style.cursor = "default";
        }
        else
        {
            subButton.current.style.opacity = "1";
            subButton.current.style.cursor = "pointer";
        }
    }, [canSave]);
    return (
        <div className="subPop">
            <form className="submission" onSubmit={postMessage}>
                <label className="subWidget" style={{borderRadius:"50%"}}>
                    <input ref={imageField} type="file" accept=".png, .jpg" style={{display:"none"}} onChange={(e) => onFileChange(e)}/>
                </label>
                <div className="subVerbose">
                    <input ref={_textInput} value={_text} onChange={(e) => change_text(e)}style={{borderRadius:"20px 0 0 20px"}} type="text" id="subTxt" placeholder="Share something..." autoComplete="off"></input>
                    <input ref={subButton} type="submit" id="subBtn" className="subWidget" value="" />
                </div>
            </form>
            <div ref={subWarning} className="subWarning">
                <div ref={compProgress}className="compProgress"></div>
                <div className="compText">⚠️ Upload exceeds 2MB, your image will be compressed! <span>({imageSize}/2.0MB)</span></div>
            </div>
            <div className="subProgress" style={{display:(uploading === false)?"none":"flex"}}>
                <div ref={_progress}/>
            </div>
            <div className="subProgress" style={{display:(uploading === false)?"none":"flex"}}>
                <div ref={_progress}/>
            </div>
            <div id="fileNest" ref={fileNest} style={{maxHeight:"0", position:"relative"}}>
                    <div className="imgOverlay">
                        <button onClick={remove_image}>🗑️</button>
                        <input type="text" value={caption} onChange={(e) => change_caption(e)}placeholder="Add a caption..." />
                    </div>
                    <img ref={image} src={localFile ? URL.createObjectURL(localFile) : null} alt={file ? file.name : null}/>
                    {/*<div className="fileCaption">Add a caption</div>*/}
            </div>
        </div>
    )
}
export default Submitter