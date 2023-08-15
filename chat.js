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

// INITIALIZE AND VALIDATION
let currentUser;
let currentChat;
let chatId;
let groupName;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const usersRef = ref(database, 'users');
const chatsRef = ref(database, 'chats');
const groupsRef = ref(database, 'groups');
let usersList = document.getElementById('users-list');
let groupsList = document.getElementById('groups-list')
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

//SIGN UP
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

//LOGIN/OUT LOGIC
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

//ADD/MODIFY USERNAME
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
    location.reload()
})
function showEditSection() {
    let form = document.getElementById('username-form')
    if (form.style.visibility == "hidden") {
        form.style.visibility = "visible"
    } else { form.style.visibility = "hidden" }
}
const editSectionButton = document.getElementById('open-edit-window')
editSectionButton.addEventListener('click', function () {
    showEditSection()
})


//OTHER USERS OVERVIEW LOGIC
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
        emailName.classList.add('user-messages')
        emailName.addEventListener('click', function (event) {
            event.preventDefault();
            createChat(otherUser);
            resetEmailNameColors()
            this.style.backgroundColor = "#a20ec0"
        });
    }
});
function resetEmailNameColors() {
    const emailNames = document.querySelectorAll('.user-messages');
    emailNames.forEach(emailName => {
        emailName.style.backgroundColor = "";
    });
}

//1 on 1 CHAT LOGIC
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
        if (exists == !true) {
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

let messageButton = document.getElementById('generate-message')
messageButton.addEventListener('click', function (event) {
    event.preventDefault();
    newMessage('chat', currentChat);
    document.getElementById("text-description").value = "";
}
)

function newMessage(chatType) {
    let contentText;
    let chatRef;
    const senderText = auth.currentUser.email;
    const messageId = Date.now();
    if (chatType === 'chat') {
        chatRef = ref(database, 'chats/' + chatId + '/messages/' + messageId);
        contentText = document.getElementById("text-description").value;
    } else if (chatType === 'group') {
        chatRef = ref(database, 'groups/' + groupName + '/messages/' + messageId);
        contentText = document.getElementById("group-text-description").value;
    }
    set(chatRef, {
        sender: senderText,
        content: contentText,
        send_time: Date.now()
    });
}

//GROUP LOGIC
let groupButton = document.getElementById('groups-button')
let chatsButton = document.getElementById('chats-button')
const usersInterface = document.querySelectorAll('.users-interface-selected')
const groupsInterface = document.querySelectorAll('.groups-interface-selected')
groupButton.addEventListener('click', function () {
    document.getElementById("chat-list").innerHTML = "";
    groupsInterface.forEach(element => {
        element.style.display = "";
      });
      usersInterface.forEach(element => {
        element.style.display = "none";
      });
      groupButton.style.background= "#a20ec0";
      groupButton.style.color= "black";
      chatsButton.style.background= "";
      chatsButton.style.color= "";
    resetGroupsNameColors();
    resetEmailNameColors();
})
chatsButton.addEventListener('click', function () {
    document.getElementById("chat-list").innerHTML = "";
    groupsInterface.forEach(element => {
        element.style.display = "none";
      });
      usersInterface.forEach(element => {
        element.style.display = "";
      });
      chatsButton.style.background= "#a20ec0";
      chatsButton.style.color= "black";
      groupButton.style.background= "";
      groupButton.style.color= "";
    resetGroupsNameColors();
    resetEmailNameColors();
})

function groupExists(title) {
    return get(groupsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const groupsData = snapshot.val();
                return title in groupsData;
            }
            return false;

        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
}

function createGroup() {
    let creator = auth.currentUser.email;
    let groupTitle = document.getElementById('new-group-name').value;
    let groupAlert = document.getElementById('group-alert')
    groupExists(groupTitle).then((exists) => {
        if (exists == !true) {
            set(ref(database, 'groups/' + groupTitle), {
                title: groupTitle,
                creator: creator,
                participants: {},
                messages: {}
            });
        } else { groupAlert.style.display = ""; }
    });
}

let groupCreation = document.getElementById('new-group-button')
groupCreation.addEventListener('click', function (event) {
    event.preventDefault();
    createGroup()
})


onValue(groupsRef, (snapshot) => {
    const groupsData = snapshot.val();
    groupsList.innerHTML = '';
    for (const groupTitle in groupsData) {
        const allGroups = groupsData[groupTitle]
        let groupsListItems = document.createElement('li')
        let groupsName = document.createElement('div')
        groupsName.textContent = allGroups.title
        groupsList.appendChild(groupsListItems)
        groupsListItems.appendChild(groupsName)
        groupsName.classList.add('group-messages')
        groupsName.addEventListener('click', function (event) {
            groupName = groupsName.innerText
            event.preventDefault();
            document.getElementById('group-creation').style.display = "none"
            document.getElementById('messages').style.display = ""
            document.getElementById('new-group-message-field').style.display = "block"
            enterGroup();
            resetGroupsNameColors(this);
            this.style.backgroundColor = "#a20ec0";
        })
        
    }

});
function enterGroup() {
    const groupRef = ref(database, 'groups/' + groupName + "/messages")
    onValue(groupRef, (snapshot) => {
        const coversationHistory = snapshot.val();
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        for (const messageId in coversationHistory) {
            const messages = coversationHistory[messageId];
            const messageSender = document.createElement("p")
            const messageDiv = document.createElement('div');
            const messageItems = document.createElement('li');
            messageDiv.appendChild(messageSender);
            messageDiv.appendChild(messageItems);
            chatList.appendChild(messageDiv);
            messageItems.textContent = messages.content
            if (messages.sender == currentUser) {
                messageDiv.classList.add("sent-message");
            } else { messageDiv.classList.add("received-message"); 
            messageSender.textContent = messages.sender}
        }
    })
};

let groupMessageButton = document.getElementById('generate-group-message')
groupMessageButton.addEventListener('click', function (event) {
    event.preventDefault();
    newMessage('group', groupName);
    document.getElementById("group-text-description").value = "";
}
)

function resetGroupsNameColors() {
    const groupsNames = document.querySelectorAll('.group-messages');
    groupsNames.forEach(groupsName => {
        groupsName.style.backgroundColor = "";
    });
}






