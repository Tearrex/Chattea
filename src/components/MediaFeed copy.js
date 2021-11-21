import { useCollectionData } from "react-firebase-hooks/firestore";
import MediaPost from './MediaPost';
import { _dbRef } from "./firebase";
import { useContext, useEffect, useState } from 'react';
import { MembersContext, UserContext } from './UserContext';
import { getDoc, getDocs, doc, where, startAfter, startAt, endAt, endBefore,
    collection, orderBy, query, limit} from '@firebase/firestore';
import { InfiniteScroll } from "react-infinite-scroll-component";
function MediaFeed (props)
{
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const [cache, setCache] = useState([]);
    const [_query, setQuery] = useState(null);
    const [lastPost, setLastPost] = useState(null);
    const _limit = 3;
    useEffect(() => {
        if(cache.length > 0)
        {
            console.log("CACHE CALLED");
            //console.log(cache);
            for(let i = 0; i < cache.length; i++)
            {
                if(_users[cache[i]] === undefined && cache[i] !== _user["user_id"])
                {
                    //console.log("user missing from cache");
                    const userRef = doc(_dbRef, "users", cache[i]);
                    getDoc(userRef).then((snapshot) => {
                        if(snapshot.exists())
                        {
                            console.log("getting billed by Google!");
                            var _json = snapshot.data();
                            //if(_user["user_id"] === snapshot.id) setAuthor(true);
                            
                            //createContext({members: {}})
                            //_setUser({..._user, username:inputName});
                            _setUsers( {..._users, [cache[i]]: {
                                //user_id: _user.id,
                                username: _json["username"],
                                pfp: _json["pfp"],
                                join_date: _json["joined"]
                            }});
                        }
                        else
                        {
                            //setName("UNKNOWN");
                            console.log("COULDNT FIND " + cache[i]);
                        }
                    }).catch((error) => {alert(error)});
                }
            }
        }
    }, [cache]);
    useEffect(() => {
        if(props.focus !== undefined) setQuery();
    }, [props.focus]);
    function cache_user(postID, postContent)
    {
        
        if(postContent["user_id"] === undefined) console.log("this doesnt make sense");
        if((postContent["user_id"] !== _user["user_id"] && _user["user_id"] !== undefined) && !cache.includes(postContent["user_id"]))
        {
            //console.log(postContent["user_id"] + " != " + _user["user_id"]);
            setCache([...cache, postContent["user_id"]]);
        }
        console.log("returned post with id " + postID);
        return (<MediaPost key={postID} msg={postContent} postID={postID}/>);
    }
    const postsRef = collection(_dbRef, 'posts');
    var _firstQuery;
    if(props.focus === undefined)
    {
        _firstQuery = query(postsRef, orderBy('date', 'desc'), limit(_limit));
    }
    else
    {
        //if(props.focus !== null)  console.log("focusing user " + props.focus);
        _firstQuery = query(postsRef, where("user_id", "==", props.focus),orderBy('date', 'desc'), limit(_limit));
    }
    //const docSnaps = await getDocs(_firstQuery);
    //const lastVisible = docSnaps.docs[docSnaps.docs.length-1];
    //console.log("last ", lastVisible);
    
    
    const [_posts] = useCollectionData(_query, {idField: 'id'});

    return (
        (typeof _posts === 'undefined') ? (<p>Loading...</p>) : (
            _posts.map((msg) => 
                (cache_user(msg.id, msg))
            )
        )
    )
}
export default MediaFeed;