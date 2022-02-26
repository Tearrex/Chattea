import { useState, useEffect, useContext, useRef } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import BuddyListItem from "./BuddyListItem";
import { getDoc, limit, orderBy, query, doc } from "@firebase/firestore";
import { _dbRef } from "../Main/firebase";
import { useParams } from "react-router";
function BuddyList(props) {
    //console.log("friends are",props.buddies);
    const { user_id } = useParams();
    const { _user, _setUser } = useContext(UserContext);
    const { _users, _setUsers } = useContext(MembersContext);
    const [cached, setCached] = useState(false);
    async function check_cache()
    {
        if(props.buddies.length > 0)
        {
            var _toCache = {};
            for (let i = 0; i < props.buddies.length; i++)
            {
                if(_users[props.buddies[i]] === undefined && props.buddies[i] !== _user.user_id)
                {
                    if (_toCache[props.buddies[i]] !== undefined) continue;
                    /*{
                        if(i < props.buddies.length - 1) continue;
                        else _setUsers( {..._users, ..._toCache});
                    }*/
                    const userRef = doc(_dbRef, "users", props.buddies[i]);
                    const _doc = await getDoc(userRef);
                    if(_doc.exists())
                    {
                        var _json = {user_id: _doc.id, ..._doc.data()};
                        _toCache[props.buddies[i]] = _json;
                        console.log("ADDED to cache (buddy list)", _json);
                    }
                    else console.log("COULDNT FIND " + props.buddies[i]);
                }
            }
            if(Object.entries(_toCache).length > 0) _setUsers( {..._users, ..._toCache});
        }
    }
    useEffect(() => {
        setCached(false);
        popupRef.current.style.display = "none";
        document.body.style.overflow = null;
    }, [user_id]);
    useEffect(async () => {
        if(cached) await check_cache();
    }, [cached]);
    const popupRef = useRef();
    function toggle_list()
    {
        if(props.buddies.length === 0) return;
        if(popupRef.current.style.display === "none")
        {
            // show it
            popupRef.current.style.display = "block";
            document.body.style.overflow = "hidden";
            setCached(true);
        }
        else
        {
            popupRef.current.style.display = "none";
            document.body.style.overflow = null;
        }
    }
    return ( 
        <div>
            <button className="buddies" onClick={toggle_list}>
                <p>{props.buddies.length} Buddies</p>
            </button>
            <div ref={popupRef} style={{display:"none"}}>
                <div className="overlay" style={{display:"block"}} onClick={toggle_list}/>
                <div className="buddiesFrame center">
                    {(props.buddies === undefined || props.buddies.length === 0) ?
                    <p>No friends :(</p> :
                    props.buddies.map((buddy, i) => {
                        return <BuddyListItem buddy={buddy} key={i} toggle={toggle_list}/>
                    })
                    }
                </div>
            </div>
        </div>
    )
}
export default BuddyList;