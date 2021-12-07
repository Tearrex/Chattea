import { doc, updateDoc, arrayRemove, arrayUnion, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect, useContext, useRef } from "react";
import { _dbRef } from "./firebase";
import { UserContext } from "./Contexts";

function BuddyButton(props) {
    const {_user, _setUser} = useContext(UserContext);
    const [added, setAdded] = useState(false);
    const inputRef = useRef();
    useEffect(() => {
        if(_user !== undefined && _user.buddies.includes(props.buddy))
        {
            setAdded(true); inputRef.current.checked = true;
        }
    }, [_user]);
    function buddify(add)
    {
        if(_user === undefined) return;
        const buddyRef = doc(_dbRef, 'users/' + _user.user_id);
        var oldUser = _user;
        if(add && !added)
        {
            updateDoc(buddyRef, {
                buddies: arrayUnion(props.buddy)
            }).then(() => {
                setAdded(true);
                const _notifRef = doc(_dbRef, "users/"+props.buddy+"/notifications/"+_user.user_id);
                try {
                    setDoc(_notifRef, {
                        type: "buddy",
                        date: serverTimestamp()
                    }).then(console.log("user has been notified!"))
                    .catch((e) => console.log("failed to notify user"));
                } catch (error) {
                    console.log("failed to notify user");
                }
            });
            oldUser.buddies.push(props.buddy);
        }
        else if(!add && added)
        {
            updateDoc(buddyRef, {
                buddies: arrayRemove(props.buddy)
            });
            setAdded(false);
            oldUser.buddies.splice(oldUser.buddies.indexOf(props.buddy), 1);
        }
        else return;
        _setUser(oldUser);
        console.log("user now", oldUser);
    }
    return (
        <label className="buddyBtn">
            <input ref={inputRef} className="addBuddy" type="checkbox" onClick={(e) => buddify(e.target.checked)} />
            <span className="stealthBtn">{!added ? "Add" : "Remove"}</span>
        </label>
    )
}
export default BuddyButton;