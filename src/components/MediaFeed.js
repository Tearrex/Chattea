import { collection, orderBy, query, limit } from 'firebase/firestore'
import { useCollectionData, useCollection } from "react-firebase-hooks/firestore";
import MediaPost from './MediaPost';
import { _dbRef } from "./firebase";
import React, { useContext, useEffect, useState } from 'react';
import { MembersContext, UserContext } from './UserContext';
import { getDoc, getDocs, doc, where, startAfter, startAt, endAt, endBefore } from '@firebase/firestore';
import InfiniteScroll from 'react-infinite-scroll-component';
function MediaFeed (props)
{
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    useEffect(() => {
        if(_users !== undefined && Object.entries(_users).length > 0)
        {
            console.log("CACHED USERS", _users);
        }
    }, [_users]);
    const [cache, setCache] = useState([]);
    useEffect(() => {
        if(cache.length > 0)
        {
            var _toCache = {};
            for(let i = 0; i < cache.length; i++)
            {
                if(_users[cache[i]] === undefined && cache[i] !== _user.user_id && _user.user_id !== undefined)
                {
                    if (_toCache[cache[i]] !== undefined) continue;
                    //console.log("userss missing from cache");
                    
                    const userRef = doc(_dbRef, "users", cache[i]);
                    getDoc(userRef).then((snapshot) => {
                        if(snapshot.exists())
                        {
                            //console.log("getting billed by Google!");
                            var _json = snapshot.data();
                            _toCache[cache[i]] = {
                                user_id: snapshot.id,..._json
                            }
                            console.log("ADDED to cache", _toCache);
                        }
                        else console.log("COULDNT FIND " + cache[i]);
                        // set users here on last iteration
                        if(i === cache.length - 1)
                        {
                            _setUsers( {..._users, ..._toCache});
                            //console.log("members context set!", _toCache);
                        }
                    }).catch((error) => {alert(error)});
                }
                
            }
        }
    }, [cache]);
    const _limit = 4;

    const postsRef = collection(_dbRef, 'posts');
    const [oldDoc, setOldDoc] = useState(null);
    const [newDoc, setNewDoc] = useState(null);
    const [posts, _setPosts] = useState({});
    function next_batch ()
    {
        //console.log("fetching batch");
        var _query;
        //if(props.focus) console.log("focusing " + props.focus);
        if (oldDoc === null || oldDoc === undefined)
        {
            if(props.focus === undefined) _query = query(postsRef, orderBy('date', 'desc'), limit(_limit));
            else _query = query(postsRef, where("user_id", "==", props.focus), limit(_limit));
        }
        else
        {
            //console.log("old doc exists");
            if(props.focus === undefined) _query = query(postsRef, orderBy('date', 'desc'), startAfter(oldDoc), limit(_limit));
            else _query = query(postsRef, where("user_id", "==", props.focus), startAfter(oldDoc), limit(_limit));
        }
        var _posts = posts;
        var _toCache = [];
        getDocs(_query).then((snap) => {
            var _old = null;
            var _new = null;
            if(snap.docs.length === 0) console.log("no posts left");
            snap.forEach((s) => {
                var data = s.data();
                //console.log(s);
                if(_new === null) _new = s;
                else _old = s;
                _posts = {..._posts, [s.id]:data};
                if(data.user_id !== _user.user_id && !cache.includes(data.user_id) && !_toCache.includes(data.user_id))
                {
                    _toCache.push(data.user_id);
                }
            });
            if(_toCache.length > 0) requestAnimationFrame((e) => {
                setCache(cache.concat(_toCache))
            });
            if(newDoc === null) setNewDoc(_new);
            else console.log("cant replace new doc", newDoc);
            setOldDoc(_old);
            _setPosts(_posts);
            //console.log("created nest",nest);
        });//.finally(_setPosts(_posts));
    }

    const col = collection(_dbRef, 'posts');
    if(props.focus === undefined)
    {
        var liveQuery = query(col, orderBy('date','desc'),
            endBefore(newDoc === null || newDoc.data()["date"] === null ? ("") : (newDoc)));
    }
    else
    {
        var liveQuery = query(col, where("user_id", "==", props.focus), orderBy('date','desc'), endBefore(newDoc));
    }
    
    const [livePosts] = useCollection(liveQuery, {idField: 'id'});
    useEffect(() => {
        if(livePosts !== undefined && livePosts.docs.length > 0)
        {
            requestAnimationFrame(() => {
                var _latest = null;
                var _newBatch = {};
                livePosts.docs.forEach((s) => {
                    if(_latest === null) _latest = s;
                    var _postData = s.data();
                    _newBatch[s.id] = _postData;
                });
                setNewDoc(_latest);
                var _posts = {..._newBatch, ...posts};
                _setPosts(_posts);
            });
        }
    }, [livePosts]);
    useEffect(() => {
        if(_user !== undefined && _user.user_id !== undefined) next_batch();
    }, [props.focus, _user]);
    useEffect(() => {
        if(Object.keys(posts).length > 0)
        {
            console.log("posts are,",posts);
            //console.log(Object.entries(posts).length);
            //setOldDoc(posts[2]);
        }
    }, [posts]);
    useEffect(() => {
        if(oldDoc !== null && oldDoc !== undefined)
        {
            hasMore(true);
            //console.log("old doc is now," + oldDoc);
        }
        else hasMore(false);
    }, [oldDoc]);
    const [more, hasMore] = useState(true);
    function show_posts()
    {
        Object.entries(posts).map((msg) => {
            (cache_user(msg));
            console.log("weeee")
            }
        )
    }
    function delete_post(postID)
    {
        const temp = {...posts};
        delete temp[postID];
        _setPosts(temp);
    }
    function send_commenters_to_cache(commenters)
    {
        requestAnimationFrame(() => {
            var _cache = [];
            for(let i = 0; i < commenters.length; i++)
            {
                if(commenters[i] !== _user.user_id && !cache.includes(commenters[i]) && _users[commenters[i]] === undefined)
                {
                    _cache.push(commenters[i]);
                }
            }
            if(_cache.length > 0) setCache([...cache, ..._cache]);
        });
    }
    function cache_user(post)
    {
        /*if((post[1].user_id !== _user["user_id"] && _user["user_id"] !== undefined) && !cache.includes(post[1].user_id))
        {
            //console.log(postContent["user_id"] + " != " + _user["user_id"]);
            setCache([...cache, post[1].user_id]);
        }*/
        return (<MediaPost toCache={(e) => send_commenters_to_cache(e)} onDelete={(e) => delete_post(post[0])}key={post[0]} msg={post[1]} postID={post[0]} authorID={post[1].user_id}/>)
    }
    return (
        /*(Object.entries(posts).length === 0) ? (<p>Loading...</p>) : (
            Object.entries(posts).map((msg) => 
                (cache_user(msg))
            )
        )*/
        <InfiniteScroll 
            dataLength={Object.entries(posts).length} //This is important field to render the next data
            next={next_batch}
            hasMore={more}
            scrollThreshold={"100%"}
            loader={<h4 style={{color:"#FFF"}}>Loading...</h4>}
            endMessage={
            <h2 style={{textAlign: 'center', color:"#FFF", fontWeight:"normal"}}>
                ☕ There is no more tea down here...
            </h2>
        }>
            {(Object.entries(posts).length === 0) ? (<p>Loading...</p>) : (
                Object.entries(posts).map((msg) => 
                    (cache_user(msg))
                )
            )}
        </InfiniteScroll>
    )
}
export default MediaFeed;