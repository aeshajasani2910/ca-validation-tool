


const loginForm = document.getElementById("loginForm");

const email = document.getElementById("email");
const password = document.getElementById("password");

const togglePassword =
document.getElementById("togglePassword");






togglePassword.addEventListener("click",function(){

if(password.type=="password"){

password.type="text";

togglePassword.classList.remove("bi-eye-slash-fill");

togglePassword.classList.add("bi-eye-fill");

}
else{

password.type="password";

togglePassword.classList.remove("bi-eye-fill");

togglePassword.classList.add("bi-eye-slash-fill");

}

});






loginForm.addEventListener("submit",function(e){

e.preventDefault();

let userEmail=email.value.trim();

let userPassword=password.value;

let savedUser=
JSON.parse(localStorage.getItem("user"));

if(savedUser==null){

alert("No Account Found");

return;

}

if(userEmail==""){

alert("Enter Email");

email.focus();

return;

}

if(userPassword==""){

alert("Enter Password");

password.focus();

return;

}





if(userEmail!==savedUser.email){

alert("Invalid Email Address");

email.focus();

return;

}

if(userPassword!==savedUser.password){

alert("Invalid Password");

password.focus();

return;

}







localStorage.setItem("isLoggedIn", "true");


localStorage.setItem("loggedUser", savedUser.firstName);

localStorage.setItem("currentUser", savedUser.email);






alert("Login Successful!");




window.location.href="dashboard.html";

});