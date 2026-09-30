



function showToast(message){

    let toast = document.getElementById("toast");

    toast.innerHTML = message;

    toast.classList.add("show");


    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}






const registerForm = document.getElementById("registerForm");

const fname = document.getElementById("fname");
const mname = document.getElementById("mname");
const lname = document.getElementById("lname");

const email = document.getElementById("email");
const mobile = document.getElementById("mobile");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const agree = document.getElementById("terms");

const togglePassword =
document.getElementById("togglePassword");

const toggleConfirmPassword =
document.getElementById("toggleConfirmPassword");






togglePassword.addEventListener("click", function(){

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

toggleConfirmPassword.addEventListener("click", function(){

if(confirmPassword.type=="password"){

confirmPassword.type="text";

toggleConfirmPassword.classList.remove("bi-eye-slash-fill");

toggleConfirmPassword.classList.add("bi-eye-fill");

}
else{

confirmPassword.type="password";

toggleConfirmPassword.classList.remove("bi-eye-fill");

toggleConfirmPassword.classList.add("bi-eye-slash-fill");

}

});






registerForm.addEventListener("submit",function(e){

e.preventDefault();

let firstName=fname.value.trim();

let middleName=mname.value.trim();

let lastName=lname.value.trim();

let userEmail=email.value.trim();

let userMobile=mobile.value.trim();

let userPassword=password.value;

let confirmPass=confirmPassword.value;




if(firstName==""){

alert("Enter First Name");

fname.focus();

return;

}



if(lastName==""){

alert("Enter Last Name");

lname.focus();

return;

}




let emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailRegex.test(userEmail)){

alert("Enter Valid Email");

email.focus();

return;

}




let mobileRegex=/^[6-9]\d{9}$/;

if(!mobileRegex.test(userMobile)){

alert("Enter Valid Mobile Number");

mobile.focus();

return;

}






let passwordRegex =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if(!passwordRegex.test(userPassword)){

alert(
"Password must contain:\n\n" +
"• Minimum 8 Characters\n" +
"• One Uppercase Letter\n" +
"• One Lowercase Letter\n" +
"• One Number\n" +
"• One Special Character"
);

password.focus();

return;

}




if(userPassword!==confirmPass){

alert("Password and Confirm Password do not match");

confirmPassword.focus();

return;

}






if(!agree.checked){

alert("Please accept Terms & Conditions");

return;

}





let oldUser =
JSON.parse(localStorage.getItem("user"));

if(oldUser){

if(oldUser.email===userEmail){

alert("Email already registered.");

return;

}

if(oldUser.mobile===userMobile){

alert("Mobile Number already registered.");

return;

}

}





let user={

firstName:firstName,

middleName:middleName,

lastName:lastName,

email:userEmail,

mobile:userMobile,

password:userPassword

};




localStorage.setItem(

"user",

JSON.stringify(user)

);



let fullName = firstName + " " + lastName;

localStorage.setItem("userName", firstName);




showToast("Account Created Successfully ✅");

registerForm.reset();


setTimeout(()=>{

    window.location.href="login.html";

},2000);


});