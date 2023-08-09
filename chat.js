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
let currentUser;
let currentChat;
let chatId;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const usersRef = ref(database, 'users');
const chatsRef = ref(database, 'chats');
let usersList = document.getElementById('users-list')




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
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('password-field').value;
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
                    last_login: Date.now(),
                    username: email
                });
                alert("User created correctly")
                document.getElementById("login").style.display = "none"
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


//display content based on login status
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user.email
        document.getElementById("current-user").style.display = ""
        document.getElementById("login").style.display = "none"
        get(ref(database, 'users/' + user.uid))
            .then((snapshot) => {
                const currentUserData = snapshot.val();
                if (currentUserData) {
                    document.getElementById('displayed-username').textContent = currentUserData.username;
                    document.getElementById('displayed-email').textContent = currentUserData.email;
                } 
            })
    } else {
        document.getElementById("current-user").style.display = "none"
        document.getElementById("login").style.display = ""
    }
});

//Add username function
function addUserName() {
    const userName = document.getElementById('new-username').value
    update(ref(database, 'users/' + auth.currentUser.uid), {
        username: userName
    });
}
const updateUsernameButton = document.getElementById('new-username-button')
updateUsernameButton.addEventListener('click', function (event) {
    event.preventDefault();
    addUserName()
})


//Logic for users list overview when logged in
onValue(usersRef, (snapshot) => {
    const userData = snapshot.val();
    for (const usersId in userData) {
        const otherUser = userData[usersId]
        let emailsList = document.createElement('li')
        let emailName = document.createElement('div')
        if (otherUser.email != currentUser) {
            emailName.textContent = otherUser.username
        } else {
            emailsList.style.display = "none"
        }
        usersList.appendChild(emailsList)
        emailsList.appendChild(emailName)
        emailName.classList.add('user-chat')
        emailName.addEventListener('click', function (event) {
            event.preventDefault();
            createChat(otherUser);
            resetEmailNameColors()
            this.style.backgroundColor = "#a20ec0"
        });
    }
});
function resetEmailNameColors() {
    const emailNames = document.querySelectorAll('.user-chat');
    emailNames.forEach(emailName => {
        emailName.style.backgroundColor = "";
    });
}


//here the in the second line I use directly return because "get" is asynchronous 
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
    document.getElementById("chat-list").innerHTML = "";
    let userOne = auth.currentUser.email
    let userTwo = secondUser.email
    let chatIdgenerator = auth.currentUser.uid + secondUser.user_id
    chatId = chatIdgenerator.split('').sort().join('');
    chatExists(chatId).then((exists) => {
        if (exists === true) { }
        else {
            set(ref(database, 'chats/' + chatId), {
                firstUser: userOne,
                secondUser: userTwo,
                messages: {}
            });
        }
    });
    document.getElementById('new-message-field').style.display = "block"
    document.getElementById("chat-area").style.display = ""
    currentChat = chatId;
    const conversationRef = ref(database, 'chats/' + currentChat + "/messages")
    onValue(conversationRef, (snapshot) => {
        const coversationHistory = snapshot.val();
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        for (const messageId in coversationHistory) {
            const messages = coversationHistory[messageId];
            const messageDiv = document.createElement('div');
            const messageItems = document.createElement('li');
            messageDiv.appendChild(messageItems);
            chatList.appendChild(messageDiv);
            messageItems.textContent = messages.content
            if (messages.sender == currentUser) {
                messageDiv.classList.add("sent-message");
            } else { messageDiv.classList.add("received-message"); }
        }
    })
}

function newMessage() {
    let contentTest = document.getElementById("text-description").value
    let senderTest = auth.currentUser.email
    let messageId = Date.now()
    set(ref(database, 'chats/' + chatId + '/messages/' + messageId), {
        sender: senderTest,
        content: contentTest,
        send_time: Date.now()
    });
}

let messageButton = document.getElementById('generate-message')
messageButton.addEventListener('click', function (event) {
    event.preventDefault();
    newMessage();
    document.getElementById("text-description").value = "";
}
)

