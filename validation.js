


const validationType = document.getElementById("validationType");
const inputValue = document.getElementById("inputValue");

const validateBtn = document.getElementById("validateBtn");
const clearBtn = document.getElementById("clearBtn");

const resultStatus = document.getElementById("resultStatus");
const resultMessage = document.getElementById("resultMessage");
const resultCard = document.getElementById("resultCard");
const loading = document.getElementById("loading");



validateBtn.addEventListener("click", validateDocument);





clearBtn.addEventListener("click", () => {

    inputValue.value = "";

    resultStatus.innerHTML = "Waiting...";
    resultMessage.innerHTML = "Enter a value and click Validate.";

    resultCard.style.borderLeft = "5px solid #2563eb";

});





async function validateDocument(){
loading.style.display = "block";
resultCard.style.display = "none";

    let type = validationType.value;
    let value = inputValue.value.trim();

    if(value===""){
        loading.style.display="none";
        resultCard.style.display="block";
        resultStatus.innerHTML="No Input";
        resultMessage.innerHTML="Please enter a value.";
        resultCard.style.borderLeft="5px solid orange";
        return;
    }

    
    if(type === "PAN"){

        let formatValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);

        if(!formatValid){
            loading.style.display="none";
            resultCard.style.display="block";
            resultStatus.innerHTML="❌ INVALID";
            resultMessage.innerHTML="PAN format is invalid.";
            resultCard.style.borderLeft="5px solid red";
            addHistory(type,value,"Invalid");
            return;
        }

        let apiResult = await verifyPANWithAPI(value);

        loading.style.display="none";
        resultCard.style.display="block";

        if(apiResult.success && apiResult.data && apiResult.data.data){
            let d = apiResult.data.data;
            resultStatus.innerHTML = "✅ " + d.status;
            resultMessage.innerHTML =
                "Name as per PAN: " + d.fullNameAsPan +
                "<br>PAN: " + d.pan;
            resultCard.style.borderLeft = "5px solid green";
            addHistory(type, value, d.status);
        } else {
            resultStatus.innerHTML = "❌ VERIFICATION FAILED";
            resultMessage.innerHTML = "Could not verify PAN from server. Please try again.";
            resultCard.style.borderLeft = "5px solid red";
            addHistory(type, value, "Failed");
        }
        return;
    }

    if (type === "TAN") {

    value = value.toUpperCase();

    // ----------------------------------------
    // STEP 1: TAN FORMAT CHECK
    // ----------------------------------------

    if (!validateTAN(value)) {

        loading.style.display = "none";
        resultCard.style.display = "block";

        resultStatus.innerHTML =
            "❌ INVALID TAN";

        resultMessage.innerHTML =
            "TAN format is invalid.";

        resultCard.style.borderLeft =
            "5px solid red";

        addHistory(
            type,
            value,
            "Invalid"
        );

        return;
    }


    // ----------------------------------------
    // STEP 2: CALL TAN API
    // ----------------------------------------

    try {

        const tanData =
            await verifyTANWithAPI(value);

        console.log(
            "TAN API Response =>",
            tanData
        );


        loading.style.display = "none";
        resultCard.style.display = "block";


        // ----------------------------------------
        // STEP 3: SUCCESS RESPONSE
        // ----------------------------------------

        if (
            tanData &&
            tanData.status === 200 &&
            tanData.data
        ) {

            const details =
                tanData.data;


            resultStatus.innerHTML =
                "✅ VALID TAN";


            resultMessage.innerHTML = `

                <div class="pan-result">

                    <p>
                        <b>TAN:</b>
                        ${value}
                    </p>

                    <p>
                        <b>Name as per TAN:</b>
                        ${details.nameAsPerTan || "N/A"}
                    </p>

                    <p>
                        <b>PAN:</b>
                        ${details.panCode || "N/A"}
                    </p>

                    <p>
                        <b>PAN Name:</b>
                        ${details.panName || "N/A"}
                    </p>

                    <p>
                        <b>Category:</b>
                        ${details.category || "N/A"}
                    </p>

                    <p>
                        <b>Status:</b>
                        Valid
                    </p>

                </div>

            `;


            resultCard.style.borderLeft =
                "5px solid green";


            addHistory(
                type,
                value,
                "Valid"
            );


        } else {

            // ----------------------------------------
            // API RESPONSE FAILED
            // ----------------------------------------

            resultStatus.innerHTML =
                "❌ TAN VERIFICATION FAILED";


            resultMessage.innerHTML =
                tanData?.message ||
                "Could not verify TAN.";


            resultCard.style.borderLeft =
                "5px solid red";


            addHistory(
                type,
                value,
                "Failed"
            );
        }


    } catch (error) {

        console.error(
            "TAN API ERROR:",
            error
        );


        loading.style.display = "none";
        resultCard.style.display = "block";


        resultStatus.innerHTML =
            "❌ TAN VERIFICATION FAILED";


        resultMessage.innerHTML =
            "Unable to fetch TAN details.";


        resultCard.style.borderLeft =
            "5px solid red";


        addHistory(
            type,
            value,
            "Failed"
        );
    }


    // IMPORTANT:
    // TAN ke baad generic validation par nahi jaana
    return;
}

if (type === "Aadhaar") {

    const aadhaarNumber = value;


   
    if (!validateAadhaar(aadhaarNumber)) {

        loading.style.display = "none";

        resultCard.style.display = "block";

        resultStatus.innerHTML = "❌ INVALID";

        resultMessage.innerHTML =
            "Aadhaar number must contain exactly 12 digits.";

        resultCard.style.borderLeft =
            "5px solid red";

        addHistory(
            type,
            maskAadhaar(aadhaarNumber),
            "Invalid"
        );

        return;
    }


    
    try {

        loading.style.display = "none";

        resultCard.style.display = "block";

        resultStatus.innerHTML =
            "🔐 Captcha Required";

        resultMessage.innerHTML =
            "Please enter the Aadhaar captcha shown below.";

        resultCard.style.borderLeft =
            "5px solid #2563eb";


        await generateAadhaarCaptcha();


        
        validateBtn.innerHTML = `
            <i class="bi bi-send"></i>
            Generate OTP
        `;


        validateBtn.onclick = async function () {

            const captchaInput =
                document.getElementById(
                    "aadhaarCaptcha"
                );


            if (!captchaInput) {

                alert(
                    "Please generate captcha first."
                );

                return;
            }


            const captchaValue =
                captchaInput.value.trim();


            if (!captchaValue) {

                alert(
                    "Please enter captcha."
                );

                captchaInput.focus();

                return;
            }


            try {

                validateBtn.disabled = true;

                validateBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm"></span>
                    Generating OTP...
                `;


                const otpData =
                    await generateAadhaarOTP(
                        aadhaarNumber,
                        captchaValue
                    );


                resultStatus.innerHTML =
                    "📱 OTP Sent";


                resultMessage.innerHTML =
                    otpData.message ||
                    "OTP generation done successfully. Please enter OTP.";


            } catch (error) {

                console.error(error);

            } finally {

                validateBtn.disabled = false;

                validateBtn.innerHTML = `
                    <i class="bi bi-send"></i>
                    Generate OTP
                `;
            }

        };


    } catch (error) {

        console.error(error);

    }

    return;
}
    
    let valid=false;

    switch(type){

        case "GSTIN":
            valid=/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value);
            break;

        case "Aadhaar":
    valid = validateAadhaar(value);
    break;
        case "Email":
            valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            break;

        case "Mobile":
            valid=/^[6-9][0-9]{9}$/.test(value);
            break;

        case "IFSC":
            valid=/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value);
            break;

        case "PIN Code":
            valid=/^[1-9][0-9]{5}$/.test(value);
            break;

        case "TAN":

    value = value.toUpperCase();

    valid = validateTAN(value);

    break;
    }
    loading.style.display="none";
    resultCard.style.display="block";

    if(valid){
        resultStatus.innerHTML="✅ VALID";
        resultMessage.innerHTML=type+" is valid.";
        resultCard.style.borderLeft="5px solid green";
        addHistory(type,value,"Valid");
    }
    else{
        resultStatus.innerHTML="❌ INVALID";
        resultMessage.innerHTML=type+" is invalid.";
        resultCard.style.borderLeft="5px solid red";
        addHistory(type,value,"Invalid");
    }
}

function addHistory(type,value,status){

let row = `

<tr>

<td>${type}</td>

<td>${value}</td>

<td>${status}</td>

</tr>

`;

document.getElementById("historyBody").innerHTML += row;

}

async function verifyTANWithAPI(tan) {

    const response = await fetch(
        '/api/verify-tan',
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                tan: tan
            })
        }
    );

    return await response.json();
}