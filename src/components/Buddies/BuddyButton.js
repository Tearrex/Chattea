import { doc, updateDoc, arrayRemove, arrayUnion, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect, useContext, useRef } from "react";
import { _dbRef } from "../firebase";
import { UserContext } from "../Contexts";

function BuddyButton(props) {
    const {_user, _setUser} = useContext(UserContext);
    const [added, setAdded] = useState(false);
    /*
    used to prevent the user from spamming, it starts to get expensive!
    this is only checked on the clientside, so it is still vulnerable.
    */
    const [lastAction, setLastAction] = useState(0);
    const [cooldown, setCooldown] = useState(0);
    const cooldownIncrement = 5000;
    const inputRef = useRef();
    useEffect(() => {
        if(_user !== undefined && _user.buddies.includes(props.buddy))
        {
            setAdded(true); inputRef.current.checked = true;
        }
    }, [_user]);
    function buddify(add)
    {
        //console.log(Date.now() - lastAction);
        if(_user === undefined || lastAction > 0 && cooldown >= (Date.now() - lastAction))
        {
            add.preventDefault();
            if(_user !== undefined) alert("Spam Protection: Please wait " + ((cooldown - (Date.now() - lastAction))/1000).toFixed(1) + " seconds");
            return;
        }
        //setLastAction(Date.now()); setCooldown(cooldown + cooldownIncrement); return;
        const buddyRef = doc(_dbRef, 'users/' + _user.user_id);
        var oldUser = _user;
        if(add.target.checked && !added)
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
        else if(!add.target.checked && added)
        {
            updateDoc(buddyRef, {
                buddies: arrayRemove(props.buddy)
            });
            setAdded(false);
            oldUser.buddies.splice(oldUser.buddies.indexOf(props.buddy), 1);
        }
        else return;
        _setUser(oldUser); setLastAction(Date.now()); setCooldown(cooldown + cooldownIncrement);
        console.log("user now", oldUser);
    }
    return (
        <label className="buddyBtn">
            <input ref={inputRef} className="addBuddy" type="checkbox" onClick={(e) => buddify(e)} />
            <p className="stealthBtn">{!added ? "Add" : "Remove"}</p>
        </label>
    )
}
export default BuddyButton;