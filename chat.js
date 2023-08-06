import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getDatabase, ref, set, update, child, get, onValue } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyDOKUWg1z411cPPFLuiSZds_aVV9yuV_YQ",
    authDomain: "echat-9af12.firebaseapp.com",
    projectId: "echat-9af12",
    storageBucket: "echat-9af12.appspot.com",
    messagingSenderId: "292846660790",
    appId: "1:292846660790:web:15800535b3456f90888a17",
    databaseURL: "https://echat-9af12-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const usersRef = ref(database, 'users');
const chatsRef = ref(database, 'chats');
let currentUser;


function validate_email(input) {
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (validRegex.test(input)) {
        return true
    } else { return false }

}
function validate_password(input) {
    if (input.length >= 6) {
        return true
    } else { return false }

}



//sign up function
submitData.addEventListener('click', (event) => {
    event.preventDefault(); //this is used to prevent the "Submit" action to have it's normal behaviour and redirect to the url with the credentials inserted
    const email = document.getElementById('new-email-field').value;
    const password = document.getElementById('new-password-field').value;
    if (validate_email(email) == false || validate_password(password) == false) {
        alert("Wrong credentials. Make sure that the email is correct and the password is longer than 6 characters")
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                set(ref(database, 'users/' + user.uid), {
                    user_id: user.uid,
                    email: email,
                    password: password,
                    chatId: Math.random().toString(36).slice(2),
                    last_login: Date.now()
                });
                alert("User created correctly")
                document.getElementById("registration").style.display = "none"
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(errorMessage)
            });
    }
});

//login function
loginUser.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('password-field').value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            update(ref(database, 'users/' + user.uid), {
                last_login: Date.now()
            });
            alert("Logged in succesfully")
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Sign in unsuccessfull: " + errorMessage)
        });

});


signOutButton.addEventListener('click', (event) => {
    event.preventDefault();
    signOut(auth).then(() => {
        alert("You have been successfully signed out!")
    }).catch((error) => {
        alert("something went wrong")
    });
})



auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user.email
        document.getElementById("current-user").style.display = ""
        document.getElementById("registration").style.display = "none"
        document.getElementById("login").style.display = "none"
        console.log(currentUser + " is logged in");
    } else {
        document.getElementById("current-user").style.display = "none"
        document.getElementById("registration").style.display = ""
        document.getElementById("login").style.display = ""
        console.log("User is logged out");
    }
});



let usersList = document.getElementById('users-list')

onValue(usersRef, (snapshot) => {
    const userData = snapshot.val();
    for (const usersId in userData){
        const otherUser = userData[usersId]
        let emailsList = document.createElement('li')
        let emailName = document.createElement('button')
        if (otherUser.email != currentUser) {
            emailName.textContent = otherUser.email
        } else {
            emailsList.style.display = "none"
        }
        usersList.appendChild(emailsList)
        emailsList.appendChild(emailName)
        emailName.classList.add('user-chat')
        emailName.addEventListener('click', function (){createChat(otherUser)});
    }
});



//here the in the secon line i use directly return because get is asynchronous 
function chatExists(chatNumber) {
    return get(chatsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const chatsData = snapshot.val();
                return chatNumber in chatsData;
            }
            return false;
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
}


function createChat(secondUser) {
    let userOne = auth.currentUser.email
    let userTwo = secondUser.email
    let chatId = auth.currentUser.uid + secondUser.user_id
    chatExists(chatId).then((exists) => {
        if (exists === true) { alert("CHAT ALREADY EXISTS") }
        else {
            set(ref(database, 'chats/' + chatId), {
                firstUser: userOne,
                secondUser: userTwo
            });
            alert("NEW CHAT STARTED")
        }
    });


}
