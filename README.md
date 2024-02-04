# Chattea
My own social media website, offering:
- 👁️‍🗨️ Private pages
- 🔐 Encrypted messaging
- 🎵 Spotify integration
- 👤 Guest view (for public pages)
- ☁️ Serverless functions

Visit the live version https://chattea.app/
[![Netlify Status](https://api.netlify.com/api/v1/badges/ff431b82-f1fd-4551-b55d-e9db14f3a3a4/deploy-status)](https://app.netlify.com/sites/chattea/deploys)

### Frontend
During COVID, I fancied learning a new frontend framework with my underlying knowledge of vanilla JavaScript from previous programming endeavors. Growing up, I was irresponsibly given a Facebook account— So I figured React would be a great candidate for exploring the rabbit hole! I was drawn to the idea of showing off the finished product to friends and it has kept me engaged throughout this learning curve—the satisfaction of solving headaches beats the sorrow of being stuck!

### Backend
With Firebase as the backend, I faced limitations that I had to work around—like how Firestore databases are queried differently from typical SQL. Being the first cloud service I used in my projects, the billing showed me how crucial it is to optimize bandwidth usage and general app performance. I consequently learned about the concept of data caching and applied it here by locally storing profile data fetched from Firebase in the browser for a set amount of time. This was especially handy considering I would later allow clients to browse the app through "guest mode" without having to log in. For the most part this performance measure has kept my billable metrics within the free tier, atleast during my testing phases.

### Firestore Database Schema
Below is a comprehensive list of all the collections and subcollections that save user data for the app

#### 👥 /users
Collection for saving profile customizations of each registered account. The document ID should be a valid user ID (UID) for future lookups.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| about | `string` | Brief user bio |
| banner | `string` | Object URL for background image |
| buddies | `string[]` | List of UIDs that the user "follows" |
| joined | `string` | Formatted date at time of user registration. Done clientside. |
| pfp | `string` | Object URL for profile picture |
| role | `string` | Defines user's access level. Either "user" or "admin". Only used for conditionally rendering moderator UI elements. |
| username | `string` | User's display name |
#### 🛡️ /admins
Collection for authorizing specific users to override database rules. The document ID should be a valid user ID (UID). **Read-only API access**
| Key   | Type   | Purpose   |
| --- | --- | --- |
| role | `string` | Placeholder key for document. Rules only check that the document exists. |


#### 🔑 /pkeys
Collection for storing cryptographic public keys of users for messaging. The document ID should be a valid user ID.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| date | `timestamp` | Time of key upload. |
| key | `string` | Base64 encoded public key. |
#### ✉️ /messages
Collection for storing active message channels between pairs of users. The document ID is auto-generated.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| activity_date | `timestamp` | Time of latest message within the channel. Read in realtime for live updates. |
| users | `string[]` | List of user IDs involved in the channel. Maximum of 2. |
#### 🔒 /messages/{channelID}/safechats
Subcollection for storing encrypted messages within a message channel. The document ID is auto-generated.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| author | `string` | User ID of message author. __Must match requestor's auth UID__. |
| content | `string` | Ciphertext for recipient's private key. |
| content_back | `string` | Ciphertext for author's private key. |
| date | `timestamp` | Time of message submission. Sorted on the frontend. |
| recipient | `string` | Recipient's user ID. |

#### 🔔 /users/{userID}/notifications
Subcollection for saving a user's unseen notifications. The document ID should be a valid post ID (if new comment) or a user ID (if new buddy).
| Key   | Type   | Purpose   |
| --- | --- | --- |
| date | `timestamp` | Time of notification. Sorted on the frontend. |
| type | `string` | Determines the redirect route on click. Either "comment" or "buddy". |
#### 🙂 /users/{userID}/smiles
Subcollection for saving the "likes" on a user's public/private post. The document ID should be a valid post ID.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| smiles | `string[]` | List of user IDs that "liked" the post. **Ugly, vulnerable, temporary implementation.** |
#### 👁️‍🗨️ /users/{userID}/posts
Subcollection for saving user-generated content to their _private page_. The document ID is auto-generated.

```same schema as "posts" collection below```


#### 🌎 /posts
Collection for posting _publicly visible_ user-generated content. The document ID is auto-generated.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| caption | `string` | Text to display over the post image (optional) |
| content | `string` | Body of text for the post (optional w/ image) |
| date | `timestamp` | Time of post submission. Date is formatted on the frontend. |
| image_url | `string` | Object URL for uploaded image (optional). |
| private | `boolean` | Whether the post is public (false) or private (true). |
| track | `map` | 🎵 Details of spotify track (if any). Includes album art URL, artist name, song name and preview URL. |
| user_id | `string` | The UID of the post author. __Must match requestor's auth UID__. |
#### 💬 /posts/{postID}/comments
Subcollection for saving associated comments of a public/private post. The document ID is auto-generated.
| Key   | Type   | Purpose   |
| --- | --- | --- |
| content | `string` | Body of text |
| date | `timestamp` | Time of comment submission. Date is formatted on the frontend. |
| user_id | `string` | The UID of the comment author. __Must match requestor's auth UID__. |
