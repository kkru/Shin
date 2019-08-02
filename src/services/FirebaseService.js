import firebase from "firebase/app";
import "@firebase/messaging";
import "firebase/firestore";
import "firebase/functions";
import "firebase/auth";
import store from "../store.js";
import router from "../router";

const POSTS = "posts";
const PORTFOLIOS = "portfolios";
const PERM = "permissions";
const COMMENTS = "comments";

// Setup Firebase
const config = {
  apiKey: "AIzaSyDQkPEb5SFmvyP9CEqROzUrMy1UAYPz1zQ",
  authDomain: "project-bf598.firebaseapp.com",
  databaseURL: "https://project-bf598.firebaseio.com",
  projectId: "project-bf598",
  storageBucket: "project-bf598.appspot.com",
  messagingSenderId: "755312082422",
  appId: "1:755312082422:web:0dc910e2ea4131ea"
};

firebase.initializeApp(config);
const firestore = firebase.firestore();

var signInLog = firebase.functions().httpsCallable("signInLog");
var signOutLog = firebase.functions().httpsCallable("signOutLog");

firebase
  .firestore()
  .enablePersistence()
  .catch(function(err) {
    if (err.code == "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a a time.
      // ...
    } else if (err.code == "unimplemented") {
      // The current browser does not support all of the
      // features required to enable persistence
      // ...
    }
  });

let messaging = null;
if (firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  messaging.usePublicVapidKey(
    "BByJZMo0kqza2QWuiwjBuwQVsIcbRdPKi07dCquSE6kXXjAUcKAIS8RQ9dvA_uon2BNzRbmvuMNOiwRSb2vhigs"
  );
}

export default {
  getPosts() {
    const postsCollection = firestore.collection(POSTS);
    return postsCollection
      .orderBy("created_at", "desc")
      .get()
      .then(docSnapshots => {
        return docSnapshots.docs.map(doc => {
          let data = doc.data();
          data.created_at = new Date(data.created_at.toDate());
          data.did = doc.id;
          return data;
        });
      });
  },
  postPost(title, body, email, name) {
    return firestore.collection(POSTS).add({
      title,
      body,
      email,
      name,
      created_at: new Date()
    });
  },
  countPost() {
    return firestore
      .collection(POSTS)
      .get()
      .then(snap => {
        return snap.size;
      });
  },
  getPortfolios() {
    const postsCollection = firestore.collection(PORTFOLIOS);
    return postsCollection
      .orderBy("created_at", "desc")
      .get()
      .then(docSnapshots => {
        return docSnapshots.docs.map(doc => {
          let data = doc.data();
          data.created_at = new Date(data.created_at.toDate());
          data.did = doc.id;
          return data;
        });
      });
  },
  postPortfolio(title, body, img, email, name) {
    return firestore.collection(PORTFOLIOS).add({
      title,
      body,
      img,
      email,
      name,
      created_at: new Date()
    });
  },
  countPortfolio() {
    return firestore
      .collection(PORTFOLIOS)
      .get()
      .then(snap => {
        return snap.size;
      });
  },
  getAllusers() {
    const userCollection = firestore.collection("permissions");
    return userCollection.get().then(docSnapshots => {
      return docSnapshots.docs.map(doc => {
        //console.log(doc.data());
        let data = doc.data();
        return data;
      });
    });
  },
  getOnePortfolio(id) {
    let idRef = firestore.collection(PORTFOLIOS).doc(id);
    return idRef
      .get()
      .then(function(doc) {
        if (doc.exists) {
          let data = doc.data();
          data.created_at = new Date(data.created_at.toDate());
          return data;
        } else {
          // doc.data() will be undefined in this case
        }
      })
      .catch(function(error) {
        console.log("Error getting portfolio:", error);
      });
  },
  getOnePost(id) {
    let idRef = firestore.collection(POSTS).doc(id);
    return idRef
      .get()
      .then(function(doc) {
        if (doc.exists) {
          let data = doc.data();
          data.created_at = new Date(data.created_at.toDate());
          return data;
        } else {
          // doc.data() will be undefined in this case
        }
      })
      .catch(function(error) {
        console.log("Error getting post:", error);
      });
  },
  getPermission(id) {
    let idRef = firestore.collection(PERM).doc(id);
    return idRef
      .get()
      .then(function(doc) {
        if (doc.exists) {
          return doc.data().rank;
        } else {
          // doc.data() will be undefined in this case
        }
      })
      .catch(function(error) {
        console.log("Error getting rank:", error);
      });
  },
  postPermission(id, permission, email, name, deviceToken) {
    return firestore
      .collection(PERM)
      .doc(id)
      .set({
        id: id,
        rank: permission,
        email: email,
        name: name,
        deviceToken: deviceToken
      });
  },
  updatePermission(id, permission) {
    var idRef = firestore.collection(PERM).doc(id);
    idRef
      .get()
      .then(function(doc) {
        if (doc.data().rank !== "admin") {
          // 권한 등급이 admin이 아니면 권한 등급 조절 불가!!
          return;
        }
      })
      .catch(function(error) {
        console.log("Error getting rank:", error);
      });
    // Set the "rank" field of the city 'permission' ( team , visitor )
    return idRef
      .update({
        rank: permission
      })
      .then(function() {})
      .catch(function(error) {
        // The document probably doesn't exist.
        console.error("Error updating rank: ", error);
      });
  },
  loginWithGoogle() {
    let provider = new firebase.auth.GoogleAuthProvider();
    return firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {
        store.state.ModalLogin = false;
        let accessToken = result.credential.accessToken;
        let user = result.user;
        signInLog({ loginMsg: "Google로그인" }).then(function(result) {});

        return result;
      })
      .catch(function(error) {
        console.error("[Google Login Error]", error);
      });
  },
  loginWithFacebook() {
    let provider = new firebase.auth.FacebookAuthProvider();
    return firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {
        store.state.ModalLogin = false;
        let accessToken = result.credential.accessToken;
        let user = result.user;
        signInLog({ loginMsg: "Facebook로그인" }).then(function(result) {});

        return result;
      })
      .catch(function(error) {
        console.error("[Facebook Login Error]", error);
      });
  },
  loginEmail(email, password) {
    return firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(function() {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(
            function(result) {
              store.state.ModalLogin = false;
              signInLog({ loginMsg: "메일로그인" }).then(function(result) {});
              alert("환영합니다");

              return result;
            },
            function(err) {
              alert("아이디/비밀번호가 일치하지 않습니다.");
            }
          );
      })
      .catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
      });
  },
  async logout() {
    let email = firebase.auth().currentUser.email;
    await signOutLog({ logEmail: email }).then(function(result) {});
    firebase
      .auth()
      .signOut()
      .then(function() {
        router.push("/");
      })
      .catch(function(error) {
        console.log(error);
      });
  },
  signUpEmail(email, password, name) {
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(
        function(res) {
          let user = res.user;
          user
            .updateProfile({ displayName: name })
            .then(function() {})
            .catch(function(error) {
              console.error("userName 업데이트 실패 : ", error);
            });

          alert("가입등록이 완료되었습니다. 다시로그인해 주세요");
          router.push("/");
        },
        function(err) {
          alert("실패" + err.message);
        }
      );
  },
  // user 정보 업데이트하는 함수
  getUser(name) {
    var user = firebase.auth().currentUser;
    console.log(user);
    console.log(name + "이름");

    user
      .updateProfile({
        displayName: name
      })
      .then(function() {
        console.log("성공");
      })
      .catch(function(error) {
        console.log("실패");
      });
  },
  getState() {
    return firebase.auth().currentUser;
  },
  getToken() {
    return store.state.accessToken;
  },
  updateDeviceToken(id) {
    var idRef = firestore.collection(PERM).doc(id);
    var deviceToken = "";
    messaging
      .requestPermission()
      .then(function() {
        messaging.getToken().then(token => {
          deviceToken = token;
          return idRef
            .update({
              deviceToken: deviceToken
            })
            .catch(function(error) {
              console.error("Error updating deviceToken: ", error);
            });
        });
      })
      .catch(function(err) {
        console.log(err);
      });
  },
  getComments(docname, docid) {
    //docname = post | portfolio , docid = postid | portfolioid
    const commentsCollection = firestore
      .collection(docname)
      .doc(docid)
      .collection(COMMENTS);
    return commentsCollection
      .orderBy("created_at", "desc")
      .get()
      .then(docSnapshots => {
        return docSnapshots.docs.map(doc => {
          let data = doc.data();
          data.created_at = new Date(data.created_at.toDate());
          data.cid = doc.id;
          return data;
        });
      });
  },
  postComment(docname, docid, name, email, text) {
    //docname = post | portfolio , docid = postid | portfolioid
    return firestore
      .collection(docname)
      .doc(docid)
      .collection(COMMENTS)
      .add({
        name,
        email,
        text,
        created_at: new Date()
      });
  }
};
