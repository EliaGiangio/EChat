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
                    email: email,
                    password: password,
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
let emails;
onValue(usersRef, (snapshot) => {
    const userData = snapshot.val();
    emails = Object.values(userData).map((user) => user.email)
    for (let i = 0; i < emails.length; i++) {
        let emailsList = document.createElement('li')
        let emailName = document.createElement('p')
        if (emails[i] != currentUser) {
            emailName.textContent = emails[i]
        } else {
            emailsList.style.display = "none"
        }
        usersList.appendChild(emailsList)
        emailsList.appendChild(emailName)
    }
});

