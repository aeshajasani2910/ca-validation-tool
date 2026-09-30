


let userName = localStorage.getItem("userName");

if(userName){

document.getElementById("welcomeText").innerHTML =
"Welcome, " + userName + " 👋";

}


const currentUser = localStorage.getItem("currentUser");

if (!currentUser) {

    window.location.href = "login.html";

}


const sidebarProfileAvatar = document.getElementById("sidebarProfileAvatar");
const sidebarProfileName = document.getElementById("sidebarProfileName");
const sidebarProfileEmail = document.getElementById("sidebarProfileEmail");

if (sidebarProfileName) {
    sidebarProfileName.innerHTML = userName || "User";
}

if (sidebarProfileEmail) {
    sidebarProfileEmail.innerHTML = currentUser || "";
}

if (sidebarProfileAvatar) {
    let initial = (userName || currentUser || "U").trim().charAt(0).toUpperCase();
    sidebarProfileAvatar.innerHTML = initial;
}


const validationType = document.getElementById("validationType");
const inputValue = document.getElementById("inputValue");

const validateBtn = document.getElementById("validateBtn");
const clearBtn = document.getElementById("clearBtn");


const resultStatus = document.getElementById("resultStatus");
const resultMessage = document.getElementById("resultMessage");

const showType = document.getElementById("showType");
const showInput = document.getElementById("showInput");
const showStatus = document.getElementById("showStatus");

const totalCount = document.getElementById("totalCount");
const validCount = document.getElementById("validCount");
const invalidCount = document.getElementById("invalidCount");
const todayCount = document.getElementById("todayCount");




let totalValidations = 0;

let validValidations = 0;

let invalidValidations = 0;

let todayChecks = 0;



let aadhaarCaptchaTxnId = null;

let aadhaarOtpTxnId = null;

let aadhaarStep = "none";


const maxLengthMap = {
    "PAN Card": 10,
    "TAN": 10,
    "Aadhaar": 12,
    "GSTIN": 15,
    "Mobile Number": 10,
    "Email Address": 100,
    "PIN Code": 6,
    "IFSC Code": 11
};

inputValue.addEventListener("input", function () {

    let value = inputValue.value;

    let type = validationType.value;

    if (type !== "Email Address") {
        value = value.toUpperCase();
        value = value.replace(/\s/g, "");
    }

    let maxLen = maxLengthMap[type];

    if (maxLen && value.length > maxLen) {
        value = value.substring(0, maxLen);
    }

    inputValue.value = value;

});


validationType.addEventListener("change", function () {

    const captchaSection = document.getElementById("captchaSection");

    if (validationType.value === "GSTIN") {
        captchaSection.style.display = "block";
    } else {
        captchaSection.style.display = "none";
    }

    let maxLen = maxLengthMap[validationType.value];

    if (maxLen) {
        inputValue.setAttribute("maxlength", maxLen);
    } else {
        inputValue.removeAttribute("maxlength");
    }

    if (maxLen && inputValue.value.length > maxLen) {
        inputValue.value = inputValue.value.substring(0, maxLen);
    }

});

const getCaptchaBtn = document.getElementById("getCaptchaBtn");

if (getCaptchaBtn) {

    getCaptchaBtn.addEventListener("click", async function () {

        const captchaImg = document.getElementById("captchaImg");
        const captchaCookie = document.getElementById("captchaCookie");
        const captchaInput = document.getElementById("captchaInput");

        captchaInput.value = "";

        const originalBtnHtml = getCaptchaBtn.innerHTML;
        getCaptchaBtn.disabled = true;
        getCaptchaBtn.innerHTML = "Loading...";

        try {

            const response = await fetch('/api/gst-captcha');

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.error("Captcha API error response:", response.status, errBody);
                alert(
                    "Captcha load nahi hua (server error " + response.status + ").\n" +
                    "Reason: " + (errBody.error?.message || errBody.error || "Unknown server error") +
                    "\n\nNode server ke terminal me 'GST CAPTCHA ERROR' log check karo."
                );
                return;
            }

            const result = await response.json();
            console.log("Captcha API response:", result);

            if (result.success && result.data && result.data.captchaImage) {

                captchaImg.src = "data:image/png;base64," + result.data.captchaImage;
                captchaImg.style.display = "block";

                captchaCookie.value = result.data.captchaCookie;

           } else {

                console.error("Unexpected captcha response shape:", result);
                alert(
                    "Captcha image response me nahi mila.\n" +
                    "Server se jo data aaya: " + JSON.stringify(result).slice(0, 200) +
                    "\n\nBrowser console (F12) me 'Captcha API response' log check karo."
                );
            }

        } catch (err) {

            console.error("Captcha fetch failed:", err);
            alert(
                "Captcha load karte waqt network/JS error aaya: " + err.message +
                "\n\nCheck karo: (1) server.js chal raha hai kya (2) internet connection."
            );
        } finally {
            getCaptchaBtn.disabled = false;
            getCaptchaBtn.innerHTML = originalBtnHtml;
        }

    });

}




validateBtn.addEventListener("click", async function () {

    await validateInput();

});



clearBtn.addEventListener("click", function () {

    inputValue.value = "";

    aadhaarCaptchaTxnId = null;

aadhaarOtpTxnId = null;

aadhaarStep = "none";

validateBtn.disabled = false;

validateBtn.innerHTML = `
    <i class="bi bi-check-circle"></i>
    Validate
`;

const captchaSection =
    document.getElementById("captchaSection");

if (captchaSection) {
    captchaSection.style.display = "none";
    captchaSection.innerHTML = "";
}

    validationType.selectedIndex = 0;

    resultStatus.innerHTML = "Waiting...";

    resultMessage.innerHTML =
        "Please enter any value and click Validate.";

    showType.innerHTML = "-";
    showInput.innerHTML = "-";
    showStatus.innerHTML = "-";

    hideBusinessDetails();

});






async function validateInput() {

    let type = validationType.value;

    let value = inputValue.value;

    if (type == "") {

        alert("Please Select Validation Type");

        return;

    }

    if (value == "") {

        alert("Please Enter Value");

        return;

    }

    let duplicateEntry = checkDuplicate(type, value);

    if (duplicateEntry) {

       let proceed = confirm(

            "⚠ This " + type + " (" + value + ") was already checked on " +
            duplicateEntry.date + " " + duplicateEntry.time +
            " with status '" + duplicateEntry.status + "'.\n\n" +
            "Do you want to validate it again?"

        );

        if (!proceed) {
            return;
        }

    }


    

if (type === "Aadhaar") {

    const aadhaarValid =
        validateAadhaar(value);


    if (!aadhaarValid) {

        resultStatus.innerHTML =
            "❌ INVALID";

        resultStatus.style.color =
            "red";

        resultMessage.innerHTML =
            "Aadhaar must contain exactly 12 digits.";

        showType.innerHTML =
            type;

        showInput.innerHTML =
            value;

        showStatus.innerHTML =
            "<span class='text-danger'>Invalid</span>";

        addHistory(
            type,
            value,
            "Invalid"
        );

        updateCards();

        return;
    }


   
    if (aadhaarStep === "none") {

        try {

            resultStatus.innerHTML =
                "⏳ Loading Captcha...";

            resultStatus.style.color =
                "#2563eb";

            resultMessage.innerHTML =
                "Generating Aadhaar captcha...";


            await generateDashboardAadhaarCaptcha();


            aadhaarStep =
                "captcha";


            validateBtn.innerHTML = `
                <i class="bi bi-send"></i>
                Generate OTP
            `;


            resultStatus.innerHTML =
                "🔐 CAPTCHA REQUIRED";


            resultMessage.innerHTML =
                "Enter the captcha shown above and click Generate OTP.";


            showType.innerHTML =
                type;

            showInput.innerHTML =
                value;

            showStatus.innerHTML =
                "<span class='text-primary'>Captcha Required</span>";


        } catch (error) {

            console.error(
                "Aadhaar Captcha Error:",
                error
            );


            resultStatus.innerHTML =
                "❌ CAPTCHA FAILED";


            resultMessage.innerHTML =
                error.message;


            resultStatus.style.color =
                "red";
        }


        return;
    }


    

    if (aadhaarStep === "captcha") {

        try {

            validateBtn.disabled =
                true;


            validateBtn.innerHTML =
                "Generating OTP...";


            const otpData =
                await generateDashboardAadhaarOTP();


            aadhaarStep =
                "otp";


            showDashboardAadhaarOTP();


            validateBtn.innerHTML = `
                <i class="bi bi-download"></i>
                Verify OTP & Download
            `;


            resultStatus.innerHTML =
                "📱 OTP SENT";


            resultStatus.style.color =
                "#2563eb";


            resultMessage.innerHTML =
                otpData.message ||
                "OTP sent successfully. Enter OTP and click Verify OTP & Download.";


            showStatus.innerHTML =
                "<span class='text-primary'>OTP Sent</span>";


        } catch (error) {

            console.error(
                "Aadhaar OTP Error:",
                error
            );


            resultStatus.innerHTML =
                "❌ OTP FAILED";


            resultMessage.innerHTML =
                error.message;


            resultStatus.style.color =
                "red";


        } finally {

            validateBtn.disabled =
                false;

            if (aadhaarStep === "captcha") {

                validateBtn.innerHTML = `
                    <i class="bi bi-send"></i>
                    Generate OTP
                `;
            }
        }


        return;
    }


    

    if (aadhaarStep === "otp") {

        try {

            validateBtn.disabled =
                true;


            validateBtn.innerHTML =
                "Downloading...";


            const data =
                await downloadDashboardAadhaar();


            resultStatus.innerHTML =
                "✅ AADHAAR DOWNLOADED";


            resultStatus.style.color =
                "green";


            resultMessage.innerHTML = `

                Aadhaar PDF downloaded successfully.

                <br><br>

                <strong>File:</strong>
                ${data.filename}

                <br><br>

                <a
                    href="${data.downloadUrl}"
                    target="_blank"
                    class="btn btn-success"
                >
                    <i class="bi bi-file-earmark-pdf"></i>
                    Open Aadhaar PDF
                </a>

            `;


            showType.innerHTML =
                type;


            showInput.innerHTML =
                maskDashboardAadhaar(value);


            showStatus.innerHTML =
                "<span class='text-success'>Downloaded</span>";


           
            addHistory(
                type,
                maskDashboardAadhaar(value),
                "Downloaded"
            );


            updateCards();


            aadhaarStep =
                "completed";


            validateBtn.innerHTML = `
                <i class="bi bi-check-circle"></i>
                Completed
            `;


        } catch (error) {

            console.error(
                "Aadhaar Download Error:",
                error
            );


            resultStatus.innerHTML =
                "❌ DOWNLOAD FAILED";


            resultStatus.style.color =
                "red";


            resultMessage.innerHTML =
                error.message;


            validateBtn.innerHTML = `
                <i class="bi bi-download"></i>
                Verify OTP & Download
            `;


        } finally {

            validateBtn.disabled =
                false;
        }


        return;
    }


    return;
}

    let valid = false;
    switch (type) {

        case "PAN Card":

            valid = validatePAN(value);

            break;

        case "TAN":

            valid = validateTAN(value);

            break;

        case "Aadhaar":

            valid = validateAadhaar(value);

            break;

        case "GSTIN":

            valid = validateGST(value);

            break;

        case "Mobile Number":

            valid = validateMobile(value);

            break;

        case "Email Address":

            valid = validateEmail(value);

            break;

        case "PIN Code":

            valid = validatePIN(value);

            break;

        case "IFSC Code":

            valid = validateIFSC(value);

            break;

    }

   showType.innerHTML = type;

    showInput.innerHTML = value;

    hideBusinessDetails();

    if (type === "GSTIN" && valid) {

        const captchaInput = document.getElementById("captchaInput");
        const captchaCookie = document.getElementById("captchaCookie");

       if (!captchaCookie.value) {
            resultMessage.innerHTML = "Please click the 'Get Captcha' button first.";
        } else if (!captchaInput.value.trim()) {
            resultMessage.innerHTML = "Please enter the captcha shown above.";
        } else {

            resultStatus.innerHTML = "⏳ Checking...";
            resultMessage.innerHTML = "Verifying with GST database...";

            try {

                const response = await fetch('/api/gst-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gstNumber: value,
                        captcha: captchaInput.value.trim(),
                        cookies: captchaCookie.value
                    })
                });
                const apiResult = await response.json();

                if (apiResult.success && apiResult.data && apiResult.data.data) {

                    const d = apiResult.data.data;

                    resultMessage.innerHTML = "Details fetched successfully from live GST database.";

                    renderGstDetails(d);

                } else {

                    resultMessage.innerHTML =
                        "Format valid, but captcha/GST verification failed. Please try the captcha again.";

                    hideBusinessDetails();
                }
            } catch (err) {

                resultMessage.innerHTML =
                    "Format valid, but server verification failed.";
            }
        }
    }

    
    if (type === "PAN Card" && valid) {

        resultStatus.innerHTML = "⏳ Checking...";
        resultMessage.innerHTML = "Verifying with PAN database...";

        try {

            const response = await fetch('/api/verify-pan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pan: value })
            });
            const apiResult = await response.json();

           if (apiResult.success && apiResult.data && apiResult.data.data) {

                const d = apiResult.data.data;

               resultMessage.innerHTML = "Details fetched successfully from live PAN database.";

                renderPanDetails(d);

            } else {

                resultMessage.innerHTML =
                    "Format valid, but could not verify with live PAN database.";

                hideBusinessDetails();

            }

        } catch (err) {

            resultMessage.innerHTML =
                "Format valid, but server verification failed.";

        }

    }


    

if (type === "TAN" && valid) {

    resultStatus.innerHTML = "⏳ Checking...";
    resultStatus.style.color = "#2563eb";

    resultMessage.style.textAlign = "left";

    resultMessage.innerHTML =
        "Verifying TAN with live TAN database...";

    showType.innerHTML = type;
    showInput.innerHTML = value;

    try {

        const response = await fetch(
            "/api/verify-tan",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    tan: value
                })
            }
        );

        const apiResult = await response.json();

        console.log(
            "TAN API RESULT:",
            apiResult
        );


        

        if (
            apiResult.success &&
            apiResult.data
        ) {

            const d = apiResult.data;

            resultStatus.innerHTML =
                "✔ VALID TAN";

            resultStatus.style.color =
                "green";


            resultMessage.style.textAlign =
                "left";


            resultMessage.innerHTML = `

                <div style="
                    margin-top:20px;
                    font-size:15px;
                    line-height:1.9;
                ">

                    <p>
                        <b>TAN:</b>
                        ${d.tan || value}
                    </p>

                    <p>
                        <b>Name as per TAN:</b>
                        ${d.name || "N/A"}
                    </p>

                    <p>
                        <b>PAN:</b>
                        ${d.pan || "N/A"}
                    </p>

                    <p>
                        <b>PAN Name:</b>
                        ${d.panName || "N/A"}
                    </p>

                    <p>
                        <b>Category:</b>
                        ${d.category || "N/A"}
                    </p>

                    <p>
                        <b>Status:</b>
                        <span style="color:green;font-weight:600;">
                            Valid
                        </span>
                    </p>

                </div>

            `;


            showStatus.innerHTML =
                "<span class='text-success'>Valid</span>";


          
            addHistory(
                type,
                value,
                "Valid"
            );

            updateCards();


            
            return;

        }


        

        resultStatus.innerHTML =
            "❌ TAN NOT VERIFIED";

        resultStatus.style.color =
            "red";

        resultMessage.style.textAlign =
            "left";

        resultMessage.innerHTML =
            apiResult.error ||
            "TAN format is correct, but live verification failed.";

        showStatus.innerHTML =
            "<span class='text-danger'>Not Verified</span>";


        addHistory(
            type,
            value,
            "Invalid"
        );

        updateCards();

        return;

    } catch (error) {

        console.error(
            "TAN API ERROR:",
            error
        );

        resultStatus.innerHTML =
            "⚠ TAN API ERROR";

        resultStatus.style.color =
            "red";

        resultMessage.style.textAlign =
            "left";

        resultMessage.innerHTML =
            "TAN format is valid, but live TAN verification failed.";

        showStatus.innerHTML =
            "<span class='text-warning'>API Error</span>";

        return;
    }
}



if (type === "Email Address" && valid) {

    resultStatus.innerHTML = "⏳ Checking...";
    resultStatus.style.color = "#2563eb";
    resultMessage.innerHTML = "Verifying email with live database...";
    showType.innerHTML = type;
    showInput.innerHTML = value;

    try {

        const response = await fetch("/api/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value })
        });

        const apiResult = await response.json();

        console.log("EMAIL API RESULT:", apiResult);

        if (apiResult.success && apiResult.data) {

            const d = apiResult.data;

            const isValid = d.email_deliverability?.status === "deliverable";

            resultStatus.innerHTML = isValid ? "✔ VALID EMAIL" : "❌ INVALID EMAIL";
            resultStatus.style.color = isValid ? "green" : "red";

            resultMessage.innerHTML =
                "Verified live — deliverability: " + (d.email_deliverability?.status || "unknown");

            showStatus.innerHTML = isValid
                ? "<span class='text-success'>Valid</span>"
                : "<span class='text-danger'>Invalid</span>";

            renderEmailDetails(d);

            addHistory(type, value, isValid ? "Valid" : "Invalid");
            updateCards();

        } else {

            resultStatus.innerHTML = "❌ NOT VERIFIED";
            resultStatus.style.color = "red";
            resultMessage.innerHTML = apiResult.error || "Email format valid, but live verification failed.";
            showStatus.innerHTML = "<span class='text-danger'>Not Verified</span>";
            hideBusinessDetails();
            addHistory(type, value, "Invalid");
            updateCards();
        }

    } catch (error) {
        console.error("EMAIL API ERROR:", error);
        resultStatus.innerHTML = "⚠ API ERROR";
        resultStatus.style.color = "red";
        resultMessage.innerHTML = "Email format valid, but live verification failed.";
        showStatus.innerHTML = "<span class='text-warning'>API Error</span>";
    }

    return;
}



if (type === "Mobile Number" && valid) {

    resultStatus.innerHTML = "⏳ Checking...";
    resultStatus.style.color = "#2563eb";
    resultMessage.innerHTML = "Verifying mobile number with live database...";
    showType.innerHTML = type;
    showInput.innerHTML = value;

    try {

        const response = await fetch("/api/verify-mobile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: value })
        });

        const apiResult = await response.json();

        console.log("MOBILE API RESULT:", apiResult);

        if (apiResult.success && apiResult.data) {

            const d = apiResult.data;
            const isValid = d.phone_validation?.is_valid === true;

            resultStatus.innerHTML = isValid ? "✔ VALID MOBILE" : "❌ INVALID MOBILE";
            resultStatus.style.color = isValid ? "green" : "red";
            resultMessage.innerHTML = "Verified live — carrier: " + (d.phone_carrier?.name || "unknown");
            showStatus.innerHTML = isValid
                ? "<span class='text-success'>Valid</span>"
                : "<span class='text-danger'>Invalid</span>";

            renderMobileDetails(d);
            addHistory(type, value, isValid ? "Valid" : "Invalid");
            updateCards();

        } else {

            resultStatus.innerHTML = "❌ NOT VERIFIED";
            resultStatus.style.color = "red";
            resultMessage.innerHTML = apiResult.error || "Mobile format valid, but live verification failed.";
            showStatus.innerHTML = "<span class='text-danger'>Not Verified</span>";
            hideBusinessDetails();
            addHistory(type, value, "Invalid");
            updateCards();
        }

    } catch (error) {
        console.error("MOBILE API ERROR:", error);
        resultStatus.innerHTML = "⚠ API ERROR";
        resultStatus.style.color = "red";
        resultMessage.innerHTML = "Mobile format valid, but live verification failed.";
        showStatus.innerHTML = "<span class='text-warning'>API Error</span>";
    }

    return;
}

   if (valid) {

        resultStatus.innerHTML = "✔ VALID";
        resultStatus.style.color = "green";

        if (type !== "PAN Card" && type !== "GSTIN") {
            resultMessage.innerHTML =
                type + " format is correct.";
        }

        showStatus.innerHTML =
            "<span class='text-success'>Valid</span>";

        addHistory(type, value, "Valid");
        updateCards();

    }
    else {

        resultStatus.innerHTML = "❌ INVALID";
        resultStatus.style.color = "red";

        resultMessage.innerHTML =
            type + " format is incorrect.";

        showStatus.innerHTML =
            "<span class='text-danger'>Invalid</span>";

        addHistory(type, value, "Invalid");
        updateCards();

    }

}




function validatePAN(value) {

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    return panRegex.test(value);

}





function validateTAN(value) {

    const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

    return tanRegex.test(value);

}




function validateAadhaar(value) {

    const aadhaarRegex = /^\d{12}$/;

    return aadhaarRegex.test(value);

}




function validateGST(value) {

    const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    return gstRegex.test(value);

}




function validateMobile(value) {

    const mobileRegex = /^[6-9]\d{10-1}$/;
    
   
    return /^[6-9]\d{9}$/.test(value);

}




function validateEmail(value) {

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(value);

}




function validatePIN(value) {

    const pinRegex =
        /^[1-9][0-9]{5}$/;

    return pinRegex.test(value);

}




function validateIFSC(value) {

    const ifscRegex =
        /^[A-Z]{4}0[A-Z0-9]{6}$/;

    return ifscRegex.test(value);

}




const darkModeBtn = document.getElementById("darkModeBtn");

darkModeBtn.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {

        darkModeBtn.innerHTML =
            '<i class="bi bi-sun-fill"></i> Light Mode';

    }

    else {

        darkModeBtn.innerHTML =
            '<i class="bi bi-moon-stars"></i> Dark Mode';

    }

});



const copyBtn = document.getElementById("copyBtn");
copyBtn.addEventListener("click", function () {

    navigator.clipboard.writeText(inputValue.value);

    alert("Copied Successfully!");

});


const typeAliasMap = {
    "PAN": "PAN Card",
    "PANCARD": "PAN Card",
    "PAN CARD": "PAN Card",
    "TAN": "TAN",
    "AADHAAR": "Aadhaar",
    "AADHAR": "Aadhaar",
    "GST": "GSTIN",
    "GSTIN": "GSTIN",
    "MOBILE": "Mobile Number",
    "MOBILE NUMBER": "Mobile Number",
    "EMAIL": "Email Address",
    "EMAIL ADDRESS": "Email Address",
    "PIN": "PIN Code",
    "PIN CODE": "PIN Code",
    "IFSC": "IFSC Code",
    "IFSC CODE": "IFSC Code"
};

function normalizeType(rawType) {

    let key = rawType.trim().toUpperCase();

    return typeAliasMap[key] || null;

}

function runValidator(type, value) {

    switch (type) {
        case "PAN Card": return validatePAN(value);
        case "TAN": return validateTAN(value);
        case "Aadhaar": return validateAadhaar(value);
        case "GSTIN": return validateGST(value);
        case "Mobile Number": return validateMobile(value);
        case "Email Address": return validateEmail(value);
        case "PIN Code": return validatePIN(value);
        case "IFSC Code": return validateIFSC(value);
        default: return false;
    }

}

function timeAgo(dateStr, timeStr) {

    let parsed = new Date(dateStr + " " + timeStr);

    if (isNaN(parsed.getTime())) return dateStr + " " + timeStr;

    let diffMs = new Date() - parsed;

    let diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return diffMin + " min ago";

    let diffHr = Math.floor(diffMin / 60);

    if (diffHr < 24) return diffHr + " hr ago";

    let diffDay = Math.floor(diffHr / 24);

    return diffDay + " day" + (diffDay > 1 ? "s" : "") + " ago";

}

function checkDuplicate(type, value) {

    const historyKey = "history_" + currentUser;

    let history = JSON.parse(localStorage.getItem(historyKey)) || [];

    let match = history.find(function (item) {

        return item.type === type &&
            item.value.toUpperCase() === value.toUpperCase();

    });

    return match || null;

}

function hideBusinessDetails() {

    const card = document.getElementById("businessDetailsCard");
    const list = document.getElementById("businessDetailsList");

    if (card) card.style.display = "none";
    if (list) list.innerHTML = "";

}

function showBusinessDetails(rows) {

    const card = document.getElementById("businessDetailsCard");
    const list = document.getElementById("businessDetailsList");

    if (!card || !list) return;

    let html = "";

    rows.forEach(function (row) {

        if (!row.value) return;

        html += "<li><span>" + row.label + "</span><span>" + row.value + "</span></li>";

    });

    if (!html) {
        card.style.display = "none";
        return;
    }

    list.innerHTML = html;
    card.style.display = "block";

}

function renderPanDetails(d) {

    showBusinessDetails([
        { label: "Full Name", value: d.fullNameAsPan },
        { label: "PAN Status", value: d.status },
        { label: "PAN Type", value: d.category },
        { label: "Aadhaar Linked", value: d.aadhaarSeedingStatus }
    ]);

}

function renderGstDetails(d) {

    showBusinessDetails([
        { label: "Legal Name", value: d.lgnm },
        { label: "Trade Name", value: d.tradeNam },
        { label: "GST Status", value: d.sts },
        { label: "Registered On", value: d.rgdt },
        { label: "Taxpayer Type", value: d.dty },
        { label: "State", value: d.stj }
    ]);

}

function renderTanDetails(d) {

    showBusinessDetails([

        {
            label: "TAN",
            value: d.tan
        },

        {
            label: "Name",
            value: d.name
        },

        {
            label: "Status",
            value: d.status
        },

        {
            label: "Address",
            value: d.address
        },

        {
            label: "Jurisdiction",
            value: d.jurisdiction
        }

    ]);

}

function renderEmailDetails(d) {

    showBusinessDetails([
        { label: "Email", value: d.email_address },
        { label: "Deliverability", value: d.email_deliverability?.status },
        { label: "Quality Score", value: d.email_quality?.score },
        { label: "Free Email", value: d.email_quality?.is_free_email ? "Yes" : "No" },
        { label: "Disposable", value: d.email_quality?.is_disposable ? "Yes" : "No" },
        { label: "Role-based", value: d.email_quality?.is_role ? "Yes" : "No" },
        { label: "Sender Name", value: (d.email_sender?.first_name || "") + " " + (d.email_sender?.last_name || "") },
        { label: "Provider", value: d.email_sender?.email_provider_name },
        { label: "Domain", value: d.email_domain?.domain },
        { label: "Risk Level", value: d.email_risk?.address_risk_status },
        { label: "Breaches Found", value: d.email_breaches?.total_breaches }
    ]);

}


function renderMobileDetails(d) {
    showBusinessDetails([
        { label: "Phone Number", value: d.phone_number },
        { label: "International Format", value: d.phone_format?.international },
        { label: "National Format", value: d.phone_format?.national },
        { label: "Carrier", value: d.phone_carrier?.name },
        { label: "Line Type", value: d.phone_carrier?.line_type },
        { label: "Line Status", value: d.phone_validation?.line_status },
        { label: "Is VOIP", value: d.phone_validation?.is_voip ? "Yes" : "No" },
        { label: "Country", value: d.phone_location?.country_name },
        { label: "Timezone", value: d.phone_location?.timezone },
        { label: "Risk Level", value: d.phone_risk?.risk_level },
        { label: "Disposable", value: d.phone_risk?.is_disposable ? "Yes" : "No" }
    ]);
}


function addHistory(type, value, status){

    const historyKey = "history_" + currentUser;

    let history =
    JSON.parse(localStorage.getItem(historyKey)) || [];

    history.push({

        type: type,

        value: value,

        status: status,

        date: new Date().toLocaleDateString(),

        time: new Date().toLocaleTimeString()

    });

    localStorage.setItem(

        historyKey,

        JSON.stringify(history)

    );

    loadHistory();

}



function loadHistory(){

    const historyKey = "history_" + currentUser;

    let history = JSON.parse(localStorage.getItem(historyKey)) || [];

    // ---------- TYPE FILTER APPLY KARO ----------
    const filterVal = document.getElementById("printFilter")?.value || "All";

    let filtered = history;

    if (filterVal === "Valid" || filterVal === "Invalid") {
        filtered = filtered.filter(item => item.status === filterVal);
    } else if (filterVal !== "All") {
        filtered = filtered.filter(item => item.type === filterVal);
    }

    // ---------- DATE FILTER APPLY KARO (past/future banne mate) ----------
    const dateVal = document.getElementById("printDateFilter")?.value || "";

    if (dateVal) {
        const [y, m, d] = dateVal.split("-");
        const selectedDateStr = new Date(y, m - 1, d).toLocaleDateString();
        filtered = filtered.filter(item => item.date === selectedDateStr);
    }

    const table = document.getElementById("historyTable");
    table.innerHTML = "";

    // ---------- KOI RECORD NA MALE TO MESSAGE BATAVO ----------
    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No records found for the selected filter/date.
                </td>
            </tr>
        `;
        updateCards();
        return;
    }

    // ---------- FILTERED RECORDS TABLE MA BATAVO ----------
    filtered.slice(0, 10).forEach(function(item, index){

        // Original history array ma no sacho index shodho (delete sachu thay mate)
        let originalIndex = history.indexOf(item);

        let badge =
            item.status == "Valid"
            ? '<span class="badge bg-success">Valid</span>'
            : '<span class="badge bg-danger">Invalid</span>';

        table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${item.type}</td>

<td>${item.value}</td>

<td>${badge}</td>

<td>
${item.date}
<br>
<small class="text-muted">${item.time}</small>
</td>

<td class="text-center">

<button
class="btn btn-danger btn-sm delete-btn"
onclick="deleteHistory(${originalIndex})">
<i class="bi bi-trash"></i>

</button>

</td>

</tr>

`;

    });

    updateCards();

}







const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", function () {

    let table=document.querySelector("#historyCard table");

    let rows = table.querySelectorAll("tr");

    let csv = [];

    rows.forEach(function (row) {

        let cols = row.querySelectorAll("th,td");

        let data = [];

        cols.forEach(function (col) {

            data.push(col.innerText);

        });

        csv.push(data.join(","));

    });

    let csvFile =
        new Blob([csv.join("\n")],
            { type: "text/csv" });

    let downloadLink =
        document.createElement("a");

    downloadLink.download =
        "ValidationHistory.csv";

    downloadLink.href =
        window.URL.createObjectURL(csvFile);

    downloadLink.click();

});


// ======================================================
// PRINT REPORT - A4 CLEAN REPORT
// ======================================================

const printBtn = document.getElementById("printBtn");

if (printBtn) {

    printBtn.addEventListener("click", function () {

        console.log("PRINT REPORT CLICKED");

        // ------------------------------------------
        // GET ALL HISTORY
        // ------------------------------------------

        const historyKey = "history_" + currentUser;

        const history =
            JSON.parse(
                localStorage.getItem(historyKey)
            ) || [];


        if (history.length === 0) {

            alert("No validation history available.");

            return;
        }


        

        const total =
            history.length;


        const valid =
            history.filter(
                item => item.status === "Valid"
            ).length;


        const invalid =
            history.filter(
                item => item.status === "Invalid"
            ).length;


       

        function escapeHtml(value) {

            if (value === null || value === undefined) {
                return "";
            }

            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }


        

        let tableRows = "";


        history.forEach(function (item, index) {

            const status =
                item.status === "Valid"
                    ? "VALID"
                    : "INVALID";


            const statusClass =
                item.status === "Valid"
                    ? "valid"
                    : "invalid";


            tableRows += `

                <tr>

                    <td class="center">
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.type || "N/A")}
                    </td>

                    <td class="value">
                        ${escapeHtml(item.value || "N/A")}
                    </td>

                    <td class="center">

                        <span class="status ${statusClass}">
                            ${status}
                        </span>

                    </td>

                    <td>

                        ${escapeHtml(item.date || "N/A")}

                        ${
                            item.time
                                ? `<br>
                                   <span class="time">
                                       ${escapeHtml(item.time)}
                                   </span>`
                                : ""
                        }

                    </td>

                </tr>

            `;
        });


        

        const generatedOn =
            new Date().toLocaleString();


        

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );


        if (!printWindow) {

            alert(
                "Please allow pop-ups for this website to print the report."
            );

            return;
        }


        

        printWindow.document.open();

        printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>CA Validation Report</title>


    <style>

        
        @page {

            size: A4 portrait;

            margin: 10mm;

        }


        * {

            box-sizing: border-box;

        }


        html,
        body {

            margin: 0;

            padding: 0;

            background: #ffffff;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            color: #1f2937;

        }


        body {

            font-size: 10px;

        }


        
        .report {

            width: 100%;

            max-width: 190mm;

            margin: 0 auto;

        }


        
        .header {

            display: flex;

            justify-content: space-between;

            align-items: center;

            border-bottom:
                2px solid #2563eb;

            padding-bottom: 8px;

            margin-bottom: 10px;

        }


        .brand {

            display: flex;

            align-items: center;

            gap: 8px;

        }


        .logo {

            width: 34px;

            height: 34px;

            border-radius: 8px;

            background: #2563eb;

            color: white;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 18px;

            font-weight: bold;

        }


        .brand-title {

            font-size: 16px;

            font-weight: 700;

            margin: 0;

            color: #1e3a8a;

        }


        .brand-subtitle {

            font-size: 8px;

            margin-top: 2px;

            color: #64748b;

        }


        .report-title {

            text-align: right;

        }


        .report-title h2 {

            margin: 0;

            font-size: 13px;

            color: #1e293b;

        }


        .report-title p {

            margin: 3px 0 0;

            font-size: 8px;

            color: #64748b;

        }


        

        .info {

            display: grid;

            grid-template-columns:
                1fr 1fr 1fr;

            gap: 6px;

            margin-bottom: 8px;

        }


        .info-box {

            border:
                1px solid #dbe4f0;

            border-radius: 5px;

            padding: 6px 8px;

            background: #f8fafc;

        }


        .info-label {

            font-size: 7px;

            color: #64748b;

            margin-bottom: 2px;

        }


        .info-value {

            font-size: 9px;

            font-weight: 600;

            color: #1e293b;

        }


        

        .summary {

            display: grid;

            grid-template-columns:
                repeat(3, 1fr);

            gap: 6px;

            margin-bottom: 10px;

        }


        .summary-card {

            border:
                1px solid #dbe4f0;

            border-radius: 5px;

            padding: 7px 9px;

            background: white;

        }


        .summary-label {

            font-size: 7px;

            color: #64748b;

        }


        .summary-value {

            margin-top: 2px;

            font-size: 14px;

            font-weight: 700;

        }


        .total {

            color: #2563eb;

        }


        .valid-count {

            color: #16a34a;

        }


        .invalid-count {

            color: #dc2626;

        }


        

        .section-title {

            font-size: 10px;

            font-weight: 700;

            color: #1e293b;

            border-bottom:
                1px solid #dbe4f0;

            padding-bottom: 4px;

            margin-bottom: 5px;

        }


       

        table {

            width: 100%;

            border-collapse: collapse;

            table-layout: fixed;

            font-size: 8px;

        }


        thead {

            display: table-header-group;

        }


        thead th {

            background: #2563eb;

            color: white;

            padding: 5px 4px;

            border:
                1px solid #1d4ed8;

            font-size: 8px;

            font-weight: 700;

        }


        tbody td {

            padding: 4px;

            border:
                1px solid #dbe4f0;

            vertical-align: middle;

            word-break: break-word;

        }


        tbody tr:nth-child(even) {

            background: #f8fafc;

        }


        tbody tr {

            page-break-inside: avoid;

            break-inside: avoid;

        }


        th:nth-child(1),
        td:nth-child(1) {

            width: 7%;

        }


        th:nth-child(2),
        td:nth-child(2) {

            width: 18%;

        }


        th:nth-child(3),
        td:nth-child(3) {

            width: 31%;

        }


        th:nth-child(4),
        td:nth-child(4) {

            width: 16%;

        }


        th:nth-child(5),
        td:nth-child(5) {

            width: 28%;

        }


        .center {

            text-align: center;

        }


        .value {

            font-weight: 600;

            color: #334155;

        }


        

        .status {

            display: inline-block;

            padding: 2px 6px;

            border-radius: 10px;

            font-size: 6.5px;

            font-weight: 700;

        }


        .status.valid {

            background: #dcfce7;

            color: #15803d;

        }


        .status.invalid {

            background: #fee2e2;

            color: #dc2626;

        }


        .time {

            font-size: 7px;

            color: #64748b;

        }


        

        .footer {

            margin-top: 8px;

            padding-top: 5px;

            border-top:
                1px solid #dbe4f0;

            display: flex;

            justify-content: space-between;

            font-size: 7px;

            color: #64748b;

        }


        

        @media print {

            html,
            body {

                width: 100%;

                background: white;

            }


            .report {

                width: 100%;

                max-width: none;

            }


            table {

                page-break-inside: auto;

            }


            tr {

                page-break-inside: avoid;

                break-inside: avoid;

            }

        }

    </style>

</head>


<body>


<div class="report">


    <!-- HEADER -->

    <div class="header">

        <div class="brand">

            <div class="logo">
                ✓
            </div>

            <div>

                <div class="brand-title">
                    CA Validation Tool
                </div>

                <div class="brand-subtitle">
                    Validate Indian Documents Easily
                </div>

            </div>

        </div>


        <div class="report-title">

            <h2>
                Validation Report
            </h2>

            <p>
                Complete Validation History
            </p>

        </div>

    </div>



    <!-- INFO -->

    <div class="info">


        <div class="info-box">

            <div class="info-label">
                Generated By
            </div>

            <div class="info-value">
                ${escapeHtml(currentUser || "User")}
            </div>

        </div>


        <div class="info-box">

            <div class="info-label">
                Total Records
            </div>

            <div class="info-value">
                ${total}
            </div>

        </div>


        <div class="info-box">

            <div class="info-label">
                Generated On
            </div>

            <div class="info-value">
                ${escapeHtml(generatedOn)}
            </div>

        </div>


    </div>



    <!-- SUMMARY -->

    <div class="summary">


        <div class="summary-card">

            <div class="summary-label">
                Total Validations
            </div>

            <div class="summary-value total">
                ${total}
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-label">
                Valid
            </div>

            <div class="summary-value valid-count">
                ${valid}
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-label">
                Invalid
            </div>

            <div class="summary-value invalid-count">
                ${invalid}
            </div>

        </div>


    </div>



    <!-- HISTORY -->

    <div class="section-title">
        Validation History
    </div>


    <table>


        <thead>

            <tr>

                <th>#</th>

                <th>Type</th>

                <th>Input</th>

                <th>Status</th>

                <th>Date & Time</th>

            </tr>

        </thead>


        <tbody>

            ${tableRows}

        </tbody>


    </table>



    <!-- FOOTER -->

    <div class="footer">

        <span>
            CA Validation Tool
        </span>

        <span>
            Confidential Validation Report
        </span>

        <span>
            Generated: ${escapeHtml(generatedOn)}
        </span>

    </div>


</div>


<script>

    window.onload = function () {

        setTimeout(function () {

            window.print();

        }, 400);

    };


    window.onafterprint = function () {

        setTimeout(function () {

            window.close();

        }, 300);

    };

<\/script>


</body>

</html>

        `);


        printWindow.document.close();

    });

}




window.addEventListener(
    "afterprint",
    function () {

        document.body.classList.remove(
            "printing-report"
        );

        document.title =
            "CA Validation Tool";

    }
);




const logoutBtn =
document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.addEventListener("click",function(){

let check=confirm("Do you want to Logout?");

if(check){

localStorage.removeItem("isLoggedIn");

localStorage.removeItem("loggedUser");
localStorage.removeItem("currentUser");

window.location.href="login.html";

}


});





}



const printFilterEl = document.getElementById("printFilter");
const printDateFilterEl = document.getElementById("printDateFilter");

if (printFilterEl) {
    printFilterEl.addEventListener("change", function () {
        loadHistory();
    });
}

if (printDateFilterEl) {
    printDateFilterEl.addEventListener("change", function () {
        loadHistory();
    });
}

loadHistory();
updateCards();





function updateCards(){

    const historyKey = "history_" + currentUser;

    let history =
    JSON.parse(localStorage.getItem(historyKey)) || [];

    totalValidations = history.length;

    validValidations =
    history.filter(item => item.status == "Valid").length;

    invalidValidations =
    history.filter(item => item.status == "Invalid").length;

    let today =
    new Date().toLocaleDateString();

    todayChecks =
    history.filter(item => item.date == today).length;

    if (totalCount) totalCount.innerHTML = totalValidations;

    if (validCount) validCount.innerHTML = validValidations;

    if (invalidCount) invalidCount.innerHTML = invalidValidations;

    if (todayCount) todayCount.innerHTML = todayChecks;

    
    

}






const searchHistory =
document.getElementById("searchHistory");

searchHistory.addEventListener("keyup",function(){

let filter=this.value.toUpperCase();

let rows=document.querySelectorAll("#historyTable tr");

rows.forEach(function(row){

let text=row.innerText.toUpperCase();

row.style.display=text.includes(filter)
? ""

: "none";

});

});


const clearHistory =
document.getElementById("clearHistory");

clearHistory.addEventListener("click",function(){

let check=
confirm("Delete All History?");

if(!check) return;

const historyKey=
"history_"+currentUser;

localStorage.removeItem(historyKey);

loadHistory();

updateCards();

});

function deleteHistory(index){

const historyKey="history_"+currentUser;

let history=
JSON.parse(localStorage.getItem(historyKey)) || [];

history.splice(index,1);

localStorage.setItem(
historyKey,
JSON.stringify(history)
);

loadHistory();
updateCards();

}

const scanQrBtn = document.getElementById("scanQrBtn");
let qrScannerInstance = null;

if (scanQrBtn) {

    scanQrBtn.addEventListener("click", function () {

        if (!validationType.value) {
            alert("Please select a Validation Type first (PAN or Aadhaar).");
            return;
        }

        const isSecure = window.isSecureContext ||
            location.hostname === "localhost" ||
            location.hostname === "127.0.0.1";

        if (!isSecure) {
            alert(
                "Camera is-liye nahi chal raha kyunki site HTTPS ya localhost pe nahi khuli hai.\n" +
                "Abhi URL hai: " + location.protocol + "//" + location.hostname + "\n\n" +
                "Browser rule: camera sirf https:// ya http://localhost pe kaam karta hai."
            );
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Ye browser camera access support nahi karta.");
            return;
        }

        const qrModalEl = document.getElementById("qrModal");
        const qrModal = new bootstrap.Modal(qrModalEl);

        function startScanner() {

            qrScannerInstance = new Html5Qrcode("qrReader");

            qrScannerInstance.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                function (decodedText) {

                    let extracted = extractValueFromQr(decodedText, validationType.value);

                    if (extracted) {

                        inputValue.value = extracted;

                        inputValue.dispatchEvent(new Event("input"));

                        qrModal.hide();

                    } else {

                        alert("Could not find a valid number for this type in the QR code.");

                    }

                },
                function () {
                    
                }
            ).catch(function (err) {

                console.error("Camera start failed:", err);

                let reason = (err && err.name) ? err.name : String(err);
                let hint = "";
if (reason === "NotAllowedError") {
    hint = "You denied camera permission — click the lock/camera icon in the browser address bar and allow permission.";
} else if (reason === "NotFoundError") {
    hint = "No camera detected on this device/browser.";
} else if (reason === "NotReadableError") {
    hint = "The camera is already being used by another app/tab — please close it.";
} else {
    hint = "Check browser permissions and camera hardware.";
}
alert("Could not start the camera (" + reason + ").\n" + hint);
                qrModal.hide();

            });

        }

        qrModalEl.addEventListener("shown.bs.modal", startScanner, { once: true });

        qrModal.show();

        qrModalEl.addEventListener("hidden.bs.modal", function stopOnClose() {

            if (qrScannerInstance) {

                qrScannerInstance.stop().catch(function () {});
                qrScannerInstance.clear().catch(function () {});
                qrScannerInstance = null;

            }

            qrModalEl.removeEventListener("hidden.bs.modal", stopOnClose);

        });

    });

}

function extractValueFromQr(text, type) {

    if (type === "PAN Card") {

        let match = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
        return match ? match[0] : null;

    }

    if (type === "Aadhaar") {

        let match = text.match(/\d{12}/) || text.match(/\d{4}\s?\d{4}\s?\d{4}/);
        return match ? match[0].replace(/\s/g, "") : null;

    }

    let panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
    if (panMatch) return panMatch[0];

    let digitsMatch = text.match(/\d{10,12}/);
    if (digitsMatch) return digitsMatch[0];

    return null;

}

const bulkFileInput = document.getElementById("bulkFileInput");
const bulkValidateBtn = document.getElementById("bulkValidateBtn");
const bulkDownloadBtn = document.getElementById("bulkDownloadBtn");
const bulkProgress = document.getElementById("bulkProgress");
const bulkResultsWrap = document.getElementById("bulkResultsWrap");
const bulkResultsBody = document.getElementById("bulkResultsBody");

let lastBulkResults = [];

if (bulkValidateBtn) {

    bulkValidateBtn.addEventListener("click", function () {

        if (!bulkFileInput.files.length) {
            alert("Please choose a CSV file first.");
            return;
        }

        const file = bulkFileInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {

            processBulkCsv(e.target.result);

        };

        reader.readAsText(file);

    });

}

function processBulkCsv(text) {

    let lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    let results = [];

    const historyKey = "history_" + currentUser;
    let history = JSON.parse(localStorage.getItem(historyKey)) || [];

    bulkProgress.style.display = "block";
    bulkProgress.innerHTML = "Processing " + lines.length + " rows...";

    lines.forEach(function (line) {

        let parts = line.split(",");

        if (parts.length < 2) return;

        let rawType = parts[0];
        let value = parts.slice(1).join(",").trim().toUpperCase().replace(/\s/g, "");

        let type = normalizeType(rawType);

        if (!type) return; 

        let valid = runValidator(type, value);

        let status = valid ? "Valid" : "Invalid";

        results.push({ type: type, value: value, status: status });

        history.push({
            type: type,
            value: value,
            status: status,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });

    });

    localStorage.setItem(historyKey, JSON.stringify(history));

    lastBulkResults = results;

    renderBulkResults(results);

    bulkProgress.innerHTML = "Done — " + results.length + " rows processed.";

    loadHistory();
    updateCards();

}

function renderBulkResults(results) {

    if (!results.length) {
        bulkResultsWrap.style.display = "none";
        bulkDownloadBtn.style.display = "none";
        return;
    }

    let html = "";

    results.forEach(function (r, index) {

        let badge = r.status === "Valid"
            ? '<span class="badge bg-success">Valid</span>'
            : '<span class="badge bg-danger">Invalid</span>';

        html += `
        <tr>
            <td>${index + 1}</td>
            <td>${r.type}</td>
            <td>${r.value}</td>
            <td>${badge}</td>
        </tr>
        `;

    });

    bulkResultsBody.innerHTML = html;
    bulkResultsWrap.style.display = "block";
    bulkDownloadBtn.style.display = "inline-block";

}

if (bulkDownloadBtn) {

    bulkDownloadBtn.addEventListener("click", function () {

        if (!lastBulkResults.length) return;

        let csv = ["Type,Value,Status"];

        lastBulkResults.forEach(function (r) {
            csv.push(r.type + "," + r.value + "," + r.status);
        });

        let blob = new Blob([csv.join("\n")], { type: "text/csv" });

        let link = document.createElement("a");
        link.download = "BulkValidationResults.csv";
        link.href = window.URL.createObjectURL(blob);
        link.click();

    });

}



const SESSION_TIMEOUT_MINUTES = 10;

let sessionTimeoutTimer = null;

function resetSessionTimer() {

    if (sessionTimeoutTimer) {
        clearTimeout(sessionTimeoutTimer);
    }

    sessionTimeoutTimer = setTimeout(function () {

        alert("You have been logged out due to inactivity.");

        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("loggedUser");
        localStorage.removeItem("currentUser");

        window.location.href = "login.html";

    }, SESSION_TIMEOUT_MINUTES * 60 * 1000);

}

["click", "keydown", "mousemove", "scroll", "touchstart"].forEach(function (evt) {

    document.addEventListener(evt, resetSessionTimer);

});

resetSessionTimer();



async function generateDashboardAadhaarCaptcha() {

    try {

        const response = await fetch(
            "/api/aadhaar/generate-captcha",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );


        const result =
            await response.json();


        console.log(
            "AADHAAR CAPTCHA RESPONSE:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.error ||
                "Captcha generation failed"
            );
        }


        const data =
            result.data.data;


       
        aadhaarCaptchaTxnId =
            data.transactionId;


        
        showDashboardAadhaarCaptcha(
            data.imageUrl
        );


        return data;


    } catch (error) {

        console.error(
            "AADHAAR CAPTCHA ERROR:",
            error
        );

        throw error;
    }
}




function showDashboardAadhaarCaptcha(imageUrl) {

    let captchaSection =
        document.getElementById(
            "captchaSection"
        );


    if (!captchaSection) {

        captchaSection =
            document.createElement("div");

        captchaSection.id =
            "captchaSection";

        inputValue.parentElement
            .appendChild(captchaSection);
    }


    captchaSection.style.display =
        "block";


    captchaSection.innerHTML = `

        <div class="mt-3 p-3 border rounded-3">

            <label class="form-label fw-bold">
                Aadhaar Captcha
            </label>


            <div class="mb-3">

                <img
                    id="aadhaarCaptchaImage"
                    src="${imageUrl}"
                    alt="Aadhaar Captcha"
                    style="
                        max-width:260px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        display:block;
                    "
                >

            </div>


            <div class="input-group">

                <input
                    type="text"
                    id="aadhaarCaptchaInput"
                    class="form-control"
                    placeholder="Enter Captcha"
                    autocomplete="off"
                >


                <button
                    type="button"
                    class="btn btn-outline-primary"
                    id="refreshAadhaarCaptcha"
                >
                    <i class="bi bi-arrow-repeat"></i>
                    Refresh
                </button>

            </div>

        </div>

    `;


    
    const refreshBtn =
        document.getElementById(
            "refreshAadhaarCaptcha"
        );


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async function () {

                try {

                    refreshBtn.disabled = true;

                    refreshBtn.innerHTML =
                        "Loading...";


                    await generateDashboardAadhaarCaptcha();


                } catch (error) {

                    alert(
                        error.message
                    );


                } finally {

                    refreshBtn.disabled =
                        false;

                    refreshBtn.innerHTML = `
                        <i class="bi bi-arrow-repeat"></i>
                        Refresh
                    `;
                }
            }
        );
    }
}




async function generateDashboardAadhaarOTP() {

    const aadhaarNumber =
        inputValue.value.trim();


    const captchaInput =
        document.getElementById(
            "aadhaarCaptchaInput"
        );


    if (!captchaInput) {

        throw new Error(
            "Captcha input not found."
        );
    }


    const captchaValue =
        captchaInput.value.trim();


    if (!captchaValue) {

        throw new Error(
            "Please enter captcha."
        );
    }


    if (!aadhaarCaptchaTxnId) {

        throw new Error(
            "Captcha transaction ID missing."
        );
    }


    const response =
        await fetch(
            "/api/aadhaar/generate-otp",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    aadhaarNumber:
                        aadhaarNumber,

                    captchaTxnId:
                        aadhaarCaptchaTxnId,

                    captchaValue:
                        captchaValue
                })

            }
        );


    const result =
        await response.json();


    console.log(
        "AADHAAR OTP RESPONSE:",
        result
    );


    if (!result.success) {

        throw new Error(
            result.error ||
            "OTP generation failed"
        );
    }


    const data =
        result.data.data;


    aadhaarOtpTxnId =
        data.txnId;


    return data;
}




function showDashboardAadhaarOTP() {

    const captchaSection =
        document.getElementById(
            "captchaSection"
        );


    if (!captchaSection) {
        return;
    }


    captchaSection.innerHTML = `

        <div class="mt-3 p-3 border rounded-3">

            <label class="form-label fw-bold">
                Aadhaar OTP
            </label>


            <input
                type="text"
                id="aadhaarOtpInput"
                class="form-control"
                maxlength="6"
                placeholder="Enter 6 digit OTP"
                inputmode="numeric"
                autocomplete="one-time-code"
            >


            <small class="text-muted">
                OTP sent to your Aadhaar registered mobile number.
            </small>

        </div>

    `;
}




async function downloadDashboardAadhaar() {

    const aadhaarNumber =
        inputValue.value.trim();


    const otpInput =
        document.getElementById(
            "aadhaarOtpInput"
        );


    if (!otpInput) {

        throw new Error(
            "OTP input not found."
        );
    }


    const otp =
        otpInput.value.trim();


    if (!/^\d{6}$/.test(otp)) {

        throw new Error(
            "Please enter a valid 6 digit OTP."
        );
    }


    if (!aadhaarOtpTxnId) {

        throw new Error(
            "OTP transaction ID missing."
        );
    }


    const response =
        await fetch(
            "/api/aadhaar/download",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    aadhaarNumber:
                        aadhaarNumber,

                    otp:
                        otp,

                    otpTxnId:
                        aadhaarOtpTxnId
                })

            }
        );


    const result =
        await response.json();


    console.log(
        "AADHAAR DOWNLOAD RESPONSE:",
        result
    );


    if (!result.success) {

        throw new Error(
            result.error ||
            "Aadhaar download failed"
        );
    }


    return result.data.data;
}

function maskDashboardAadhaar(value) {

    if (!value || value.length !== 12) {
        return "XXXXXXXXXXXX";
    }

    return (
        value.substring(0, 4) +
        "XXXX" +
        value.substring(8)
    );
}


document.addEventListener("DOMContentLoaded", function () {

    const printReportBtn = document.getElementById("printReportBtn");

    if (!printReportBtn) {
        console.error("Print Report button not found");
        return;
    }

    printReportBtn.addEventListener("click", function () {

        const historyKey = "history_" + currentUser;
        let history = JSON.parse(localStorage.getItem(historyKey)) || [];

       
        const filterVal = document.getElementById("printFilter")?.value || "All";
        const dateVal = document.getElementById("printDateFilter")?.value || "";

        let filtered = history;

        if (filterVal === "Valid" || filterVal === "Invalid") {
            filtered = filtered.filter(item => item.status === filterVal);
        } else if (filterVal !== "All") {
            filtered = filtered.filter(item => item.type === filterVal);
        }

        if (dateVal) {
           
            const dateObj = new Date(dateVal);
            const dateStr = dateObj.toLocaleDateString();
            filtered = filtered.filter(item => item.date === dateStr);
        }

        if (filtered.length === 0) {
            alert("No records found for the selected filter.");
            return;
        }

        
        const total = filtered.length;
        const valid = filtered.filter(item => item.status === "Valid").length;
        const invalid = filtered.filter(item => item.status !== "Valid").length;

        document.getElementById("printUser").innerHTML = userName || currentUser || "User";
        document.getElementById("printDate").innerHTML = new Date().toLocaleString();
        document.getElementById("printDate2").innerHTML = new Date().toLocaleString();
        document.getElementById("printFilterLabel").innerHTML =
            filterVal !== "All" ? "(" + filterVal + ")" : "";

      
        document.getElementById("printTotal").innerHTML = total;
        document.getElementById("printValid").innerHTML = valid;
        document.getElementById("printInvalid").innerHTML = invalid;

       
        let rows = "";

        filtered.forEach(function (item, index) {

            const statusClass = item.status === "Valid" ? "status-valid" : "status-invalid";
            const statusLabel = item.status === "Valid" ? "VALID" : "INVALID";

            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.type}</td>
                    <td>${item.value}</td>
                    <td><span class="${statusClass}">${statusLabel}</span></td>
                    <td>${item.date}<br><span class="report-time">${item.time || ""}</span></td>
                </tr>
            `;

        });

        document.getElementById("printTableBody").innerHTML = rows;

        
        document.body.classList.add("printing-report");

       
        setTimeout(function () {
            window.print();
        }, 200);

    });

});

// ==========================================
// BULK TAN CSV VALIDATION
// ==========================================

let bulkTanResults = [];

const tanCsvFile = document.getElementById("tanCsvFile");
const uploadTanCsvBtn = document.getElementById("uploadTanCsvBtn");
const csvStatus = document.getElementById("csvStatus");

if (uploadTanCsvBtn) {

    uploadTanCsvBtn.addEventListener("click", async function () {

        const file = tanCsvFile.files[0];

        // Check file selected
        if (!file) {

            csvStatus.innerHTML = `
                <div class="alert alert-warning">
                    Please select a CSV file first.
                </div>
            `;

            return;
        }

        // Check CSV extension
        if (!file.name.toLowerCase().endsWith(".csv")) {

            csvStatus.innerHTML = `
                <div class="alert alert-danger">
                    Please upload a CSV file only.
                </div>
            `;

            return;
        }

        try {

            uploadTanCsvBtn.disabled = true;

            uploadTanCsvBtn.innerHTML = `
                <i class="bi bi-hourglass-split"></i>
                Reading CSV...
            `;

            // Read CSV file
            const csvText = await file.text();

            // Split CSV into rows
            const rows = csvText
                .split(/\r?\n/)
                .map(row => row.trim())
                .filter(row => row !== "");

            // Check rows
            if (rows.length < 2) {

                throw new Error(
                    "CSV file must contain a TAN heading and at least one TAN number."
                );
            }

            // First row should be TAN
            const header = rows[0]
                .split(",")[0]
                .trim()
                .replace(/"/g, "")
                .toUpperCase();

            if (header !== "TAN") {

                throw new Error(
                    "First column heading must be TAN."
                );
            }

            // Get TAN numbers
            const tanNumbers = rows
                .slice(1)
                .map(row => {

                    return row
                        .split(",")[0]
                        .trim()
                        .replace(/"/g, "")
                        .toUpperCase();

                })
                .filter(tan => tan !== "");

            if (tanNumbers.length === 0) {

                throw new Error(
                    "No TAN numbers found in the CSV file."
                );
            }

            // Clear previous results
            bulkTanResults = [];

            csvStatus.innerHTML = `
                <div class="alert alert-info">
                    Found <strong>${tanNumbers.length}</strong> TAN numbers.
                    Starting validation...
                </div>
            `;

            // ==========================================
            // VALIDATE TAN NUMBERS ONE BY ONE
            // ==========================================

            for (let i = 0; i < tanNumbers.length; i++) {

                const tan = tanNumbers[i];

                // Show progress
                csvStatus.innerHTML = `
                    <div class="alert alert-info">
                        <strong>Validating ${i + 1} of ${tanNumbers.length}</strong>
                        <br>
                        Current TAN:
                        <strong>${tan}</strong>
                    </div>
                `;

                try {

                    // Basic TAN format validation
                    if (
                        typeof validateTAN === "function" &&
                        !validateTAN(tan)
                    ) {

                        bulkTanResults.push({

                            TAN: tan,

                            Status: "Invalid",

                            Name: "",

                            PAN: "",

                            PANName: "",

                            Category: "",

                            Response: null

                        });

                        continue;
                    }

                    // Call existing TAN API
                    const response = await fetch("/api/verify-tan", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        tan: tan
    })
});

const result = await response.json();

console.log(`TAN ${tan} API response:`, result);

                    console.log(
                        `TAN ${i + 1} response:`,
                        result
                    );

                    // Store COMPLETE API response
                    bulkTanResults.push({

                        TAN: tan,

                        Status:
                            result.success === true
                                ? "Valid"
                                : "Invalid",

                        Name:
                            result.data?.name || "",

                        PAN:
                            result.data?.pan || "",

                        PANName:
                            result.data?.panName || "",

                        Category:
                            result.data?.category || "",

                        Response: result

                    });

                } catch (error) {

                    console.error(
                        `Error validating TAN ${tan}:`,
                        error
                    );

                    bulkTanResults.push({

                        TAN: tan,

                        Status: "Failed",

                        Name: "",

                        PAN: "",

                        PANName: "",

                        Category: "",

                        Response: {
                            error: error.message
                        }

                    });

                }
            }

            // ==========================================
            // VALIDATION COMPLETED
            // ==========================================

            const validCount =
                bulkTanResults.filter(
                    item => item.Status === "Valid"
                ).length;

            const invalidCount =
                bulkTanResults.filter(
                    item =>
                        item.Status === "Invalid" ||
                        item.Status === "Failed"
                ).length;

            csvStatus.innerHTML = `
                <div class="alert alert-success">

                    <strong>
                        <i class="bi bi-check-circle"></i>
                        TAN Validation Completed
                    </strong>

                    <hr>

                    Total TAN:
                    <strong>${bulkTanResults.length}</strong>

                    &nbsp; | &nbsp;

                    Valid:
                    <strong>${validCount}</strong>

                    &nbsp; | &nbsp;

                    Invalid/Failed:
                    <strong>${invalidCount}</strong>

                </div>
            `;

            // Show results in console for now
            console.log(
                "========== BULK TAN RESULTS =========="
            );

           // ==========================================
// SHOW BULK TAN RESULTS IN TABLE
// ==========================================

const bulkTanResultCard =
    document.getElementById("bulkTanResultCard");

const bulkTanResultTable =
    document.getElementById("bulkTanResultTable");

const bulkTotalTan =
    document.getElementById("bulkTotalTan");

const bulkValidTan =
    document.getElementById("bulkValidTan");

const bulkInvalidTan =
    document.getElementById("bulkInvalidTan");


bulkTotalTan.textContent =
    bulkTanResults.length;

bulkValidTan.textContent =
    validCount;

bulkInvalidTan.textContent =
    invalidCount;


// Clear old table
bulkTanResultTable.innerHTML = "";


// Add each TAN result
bulkTanResults.forEach((item, index) => {

    let statusBadge = "";

    if (item.Status === "Valid") {

        statusBadge = `
            <span class="badge bg-success">
                Valid
            </span>
        `;

    } else if (item.Status === "Invalid") {

        statusBadge = `
            <span class="badge bg-danger">
                Invalid
            </span>
        `;

    } else {

        statusBadge = `
            <span class="badge bg-warning text-dark">
                Failed
            </span>
        `;
    }


    const row = document.createElement("tr");

    row.innerHTML = `

        <td>${index + 1}</td>

        <td>
            <strong>${item.TAN || "-"}</strong>
        </td>

        <td>
            ${statusBadge}
        </td>

        <td>
            ${item.Name || "-"}
        </td>

        <td>
            ${item.PAN || "-"}
        </td>

        <td>
            ${item.PANName || "-"}
        </td>

        <td>
            ${item.Category || "-"}
        </td>

    `;

    bulkTanResultTable.appendChild(row);

});


// Show result card
bulkTanResultCard.style.display = "block";


// Scroll to results
bulkTanResultCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
});
        } catch (error) {

            console.error(
                "CSV Error:",
                error
            );

            csvStatus.innerHTML = `
                <div class="alert alert-danger">

                    <strong>
                        <i class="bi bi-exclamation-triangle"></i>
                        Error
                    </strong>

                    <br>

                    ${error.message}

                </div>
            `;

        } finally {

            uploadTanCsvBtn.disabled = false;

            uploadTanCsvBtn.innerHTML = `
                <i class="bi bi-upload"></i>
                Upload & Validate CSV
            `;
        }

    });

}

// ==========================================
// DOWNLOAD TAN RESULTS AS CSV
// ==========================================

const downloadTanCsvBtn =
    document.getElementById("downloadTanCsvBtn");


if (downloadTanCsvBtn) {

    downloadTanCsvBtn.addEventListener(
        "click",
        function () {

            if (bulkTanResults.length === 0) {

                alert(
                    "No TAN validation results available."
                );

                return;
            }


            const headers = [
                "TAN",
                "Status",
                "Name",
                "PAN",
                "PAN Name",
                "Category"
            ];


            const rows = bulkTanResults.map(item => [

                item.TAN || "",

                item.Status || "",

                item.Name || "",

                item.PAN || "",

                item.PANName || "",

                item.Category || ""

            ]);


            const csvRows = [
                headers,
                ...rows
            ];


            const csvContent =
                csvRows
                    .map(row =>

                        row
                            .map(value =>
                                `"${String(value)
                                    .replace(/"/g, '""')}"`
                            )
                            .join(",")

                    )
                    .join("\n");


            const blob = new Blob(
                [csvContent],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "TAN_Validation_Report.csv";


            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        }
    );

}

// ==========================================
// DOWNLOAD COMPLETE TAN API RESPONSES JSON
// ==========================================

const downloadTanJsonBtn =
    document.getElementById("downloadTanJsonBtn");


if (downloadTanJsonBtn) {

    downloadTanJsonBtn.addEventListener(
        "click",
        function () {

            if (bulkTanResults.length === 0) {

                alert(
                    "No TAN validation results available."
                );

                return;
            }


            const jsonContent =
                JSON.stringify(
                    bulkTanResults,
                    null,
                    4
                );


            const blob = new Blob(
                [jsonContent],
                {
                    type:
                        "application/json;charset=utf-8;"
                }
            );


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "TAN_Validation_Responses.json";


            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        }
    );

}

// =============================
// BULK PAN VALIDATION
// =============================

let bulkPanResults = [];

const panCsvFile = document.getElementById("panCsvFile");
const uploadPanCsvBtn = document.getElementById("uploadPanCsvBtn");
const panCsvStatus = document.getElementById("panCsvStatus");

if (uploadPanCsvBtn) {

    uploadPanCsvBtn.addEventListener("click", async function () {

        const file = panCsvFile.files[0];

        if (!file) {
            panCsvStatus.innerHTML = `
                <div class="alert alert-warning">
                    Please select a PAN CSV file first.
                </div>
            `;
            return;
        }

        panCsvStatus.innerHTML = `
            <div class="alert alert-info">
                Reading PAN CSV file...
            </div>
        `;

        const text = await file.text();

        const rows = text
            .split(/\r?\n/)
            .map(row => row.trim())
            .filter(row => row !== "");

        if (rows.length < 2) {
            panCsvStatus.innerHTML = `
                <div class="alert alert-danger">
                    CSV file does not contain enough PAN data.
                </div>
            `;
            return;
        }

        // Remove header row
        const panRows = rows.slice(1);

        bulkPanResults = [];

        panCsvStatus.innerHTML = `
            <div class="alert alert-info">
                Found ${panRows.length} PAN numbers. Validation started...
            </div>
        `;

        // Validate PAN one-by-one
        for (let i = 0; i < panRows.length; i++) {

            const pan = panRows[i]
                .split(",")[0]
                .trim()
                .toUpperCase();

            if (!pan) {
                continue;
            }

            console.log(`Validating PAN ${i + 1}/${panRows.length}: ${pan}`);

            // Check PAN format
            if (!validatePAN(pan)) {

                bulkPanResults.push({
                    PAN: pan,
                    Status: "Invalid Format",
                    Response: null
                });

                continue;
            }

            // Call existing PAN API
            const result = await verifyPANWithAPI(pan);

            bulkPanResults.push({
                PAN: pan,
                Status: result.success ? "Valid" : "Failed",
                Response: result
            });

            // Update progress
            panCsvStatus.innerHTML = `
                <div class="alert alert-info">
                    Validating PAN ${i + 1} of ${panRows.length}...
                    <br>
                    Current PAN: <strong>${pan}</strong>
                </div>
            `;
        }

        console.log("Bulk PAN Results:", bulkPanResults);
        
        // Show Bulk PAN Results
const bulkPanResultCard = document.getElementById("bulkPanResultCard");
const bulkPanResultTable = document.getElementById("bulkPanResultTable");

const bulkTotalPan = document.getElementById("bulkTotalPan");
const bulkValidPan = document.getElementById("bulkValidPan");
const bulkInvalidPan = document.getElementById("bulkInvalidPan");

let validPanCount = 0;
let invalidPanCount = 0;

bulkPanResults.forEach((item, index) => {

    if (item.Status === "Valid") {
        validPanCount++;
    } else {
        invalidPanCount++;
    }

    let apiResponse = "";

    if (item.Response) {
        apiResponse = JSON.stringify(item.Response);
    } else {
        apiResponse = "Invalid PAN format";
    }

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${index + 1}</td>

        <td>
            <strong>${item.PAN}</strong>
        </td>

        <td>
            ${
                item.Status === "Valid"
                ? `<span class="badge bg-success">Valid</span>`
                : `<span class="badge bg-danger">${item.Status}</span>`
            }
        </td>

        <td>
            <details>
                <summary>View Response</summary>
                <pre class="mt-2 small" style="white-space: pre-wrap;">${apiResponse}</pre>
            </details>
        </td>
    `;

    bulkPanResultTable.appendChild(row);

});

bulkTotalPan.textContent = bulkPanResults.length;
bulkValidPan.textContent = validPanCount;
bulkInvalidPan.textContent = invalidPanCount;

bulkPanResultCard.style.display = "block";
        panCsvStatus.innerHTML = `
            <div class="alert alert-success">
                PAN validation completed successfully.
                <br>
                Total PANs processed: <strong>${bulkPanResults.length}</strong>
            </div>
        `;

    });

}

// =============================
// PAN CSV DOWNLOAD
// =============================

const downloadPanCsvBtn = document.getElementById("downloadPanCsvBtn");

if (downloadPanCsvBtn) {

    downloadPanCsvBtn.addEventListener("click", function () {

        if (bulkPanResults.length === 0) {
            alert("No PAN validation results available.");
            return;
        }

        let csvContent = "PAN,Status,API Response\n";

        bulkPanResults.forEach(item => {

            let responseText = item.Response
                ? JSON.stringify(item.Response)
                : "Invalid PAN format";

            responseText = responseText.replace(/"/g, '""');

            csvContent += `"${item.PAN}","${item.Status}","${responseText}"\n`;
        });

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "PAN_Validation_Report.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    });

}


// =============================
// PAN JSON DOWNLOAD
// =============================

const downloadPanJsonBtn = document.getElementById("downloadPanJsonBtn");

if (downloadPanJsonBtn) {

    downloadPanJsonBtn.addEventListener("click", function () {

        if (bulkPanResults.length === 0) {
            alert("No PAN validation results available.");
            return;
        }

        const jsonContent = JSON.stringify(
            bulkPanResults,
            null,
            4
        );

        const blob = new Blob([jsonContent], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "PAN_Validation_Responses.json";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    });

}

// ========================================
// UNIFIED BULK DOCUMENT VALIDATION
// ========================================

let unifiedBulkResults = [];

const bulkValidationType = document.getElementById("bulkValidationType");
const bulkCsvFile = document.getElementById("bulkCsvFile");
const uploadBulkCsvBtn = document.getElementById("uploadBulkCsvBtn");
const bulkCsvStatus = document.getElementById("bulkCsvStatus");

if (uploadBulkCsvBtn) {

    uploadBulkCsvBtn.addEventListener("click", async function () {

        const selectedType = bulkValidationType.value;
        const file = bulkCsvFile.files[0];

        // Check validation type
        if (!selectedType) {
            bulkCsvStatus.innerHTML = `
                <div class="alert alert-warning">
                    Please select a validation type first.
                </div>
            `;
            return;
        }

        // Check CSV file
        if (!file) {
            bulkCsvStatus.innerHTML = `
                <div class="alert alert-warning">
                    Please select a CSV file first.
                </div>
            `;
            return;
        }

        // Read CSV
        const text = await file.text();

        const rows = text
            .split(/\r?\n/)
            .map(row => row.trim())
            .filter(row => row !== "");

        if (rows.length < 2) {
            bulkCsvStatus.innerHTML = `
                <div class="alert alert-danger">
                    CSV file does not contain enough data.
                </div>
            `;
            return;
        }

        // Remove header
        const dataRows = rows.slice(1);

        unifiedBulkResults = [];

        bulkCsvStatus.innerHTML = `
            <div class="alert alert-info">
                Starting ${selectedType} bulk validation...
                <br>
                Total records: <strong>${dataRows.length}</strong>
            </div>
        `;

        // Process one-by-one
        for (let i = 0; i < dataRows.length; i++) {

            const value = dataRows[i]
                .split(",")[0]
                .trim()
                .toUpperCase();

            if (!value) {
                continue;
            }

            bulkCsvStatus.innerHTML = `
                <div class="alert alert-info">
                    Validating ${i + 1} of ${dataRows.length}
                    <br>
                    Type: <strong>${selectedType}</strong>
                    <br>
                    Value: <strong>${value}</strong>
                </div>
            `;

            let result;

            // PAN
            if (selectedType === "PAN") {

                if (!validatePAN(value)) {

                    result = {
                        success: false,
                        error: "Invalid PAN format"
                    };

                } else {

                    result = await verifyPANWithAPI(value);

                }
            }

            // TAN
            else if (selectedType === "TAN") {

                if (!validateTAN(value)) {

                    result = {
                        success: false,
                        error: "Invalid TAN format"
                    };

                } else {

                    const response = await fetch("/api/verify-tan", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            tan: value
                        })
                    });

                    result = await response.json();

                }
            }

            // Mobile
else if (selectedType === "Mobile") {

    if (!validateMobile(value)) {

        result = {
            success: false,
            error: "Invalid Mobile Number format"
        };

    } else {

        result = {
            success: true,
            message: "Valid Mobile Number format"
        };

    }
}


// Email
else if (selectedType === "Email") {

    // Email should not be converted to uppercase
    const emailValue = dataRows[i]
        .split(",")[0]
        .trim();

    if (!validateEmail(emailValue)) {

        result = {
            success: false,
            error: "Invalid Email Address format"
        };

    } else {

        result = {
            success: true,
            message: "Valid Email Address format"
        };

    }

}
            unifiedBulkResults.push({
                Type: selectedType,
                Value: value,
                Status: result.success ? "Valid" : "Invalid / Failed",
                Response: result
            });
        }

        console.log("Unified Bulk Results:", unifiedBulkResults);

        // ========================================
// SHOW UNIFIED BULK RESULTS
// ========================================

const unifiedBulkResultCard =
    document.getElementById("unifiedBulkResultCard");

const unifiedBulkResultTable =
    document.getElementById("unifiedBulkResultTable");

const unifiedBulkTotal =
    document.getElementById("unifiedBulkTotal");

const unifiedBulkValid =
    document.getElementById("unifiedBulkValid");

const unifiedBulkInvalid =
    document.getElementById("unifiedBulkInvalid");


// Clear old results
unifiedBulkResultTable.innerHTML = "";


// Count results
let validCount = 0;
let invalidCount = 0;


// Create table rows
unifiedBulkResults.forEach((item, index) => {

    if (item.Status === "Valid") {
        validCount++;
    } else {
        invalidCount++;
    }

    const row = document.createElement("tr");

    const srCell = document.createElement("td");
    srCell.textContent = index + 1;

    const typeCell = document.createElement("td");
    typeCell.textContent = item.Type;

    const valueCell = document.createElement("td");
    valueCell.textContent = item.Value;

    const statusCell = document.createElement("td");

    const statusBadge = document.createElement("span");

    statusBadge.className =
        item.Status === "Valid"
            ? "badge bg-success"
            : "badge bg-danger";

    statusBadge.textContent = item.Status;

    statusCell.appendChild(statusBadge);


    const responseCell = document.createElement("td");

    const responseText =
    document.createElement("pre");

responseText.className =
    "small mb-0";

responseText.style.whiteSpace =
    "pre-wrap";

responseText.style.maxHeight = "80px";
responseText.style.maxWidth = "220px";
responseText.style.overflow = "hidden";

responseText.style.fontSize =
    "11px";

responseText.textContent =
    JSON.stringify(item.Response, null, 2);

    responseCell.appendChild(responseText);


    row.appendChild(srCell);
    row.appendChild(typeCell);
    row.appendChild(valueCell);
    row.appendChild(statusCell);
    row.appendChild(responseCell);


    unifiedBulkResultTable.appendChild(row);

});


// Update summary
unifiedBulkTotal.textContent =
    unifiedBulkResults.length;

unifiedBulkValid.textContent =
    validCount;

unifiedBulkInvalid.textContent =
    invalidCount;


// Show result card
unifiedBulkResultCard.style.display = "block";

        bulkCsvStatus.innerHTML = `
            <div class="alert alert-success">
                Bulk validation completed.
                <br>
                Type: <strong>${selectedType}</strong>
                <br>
                Total processed:
                <strong>${unifiedBulkResults.length}</strong>
            </div>
        `;

    });

}

// ========================================
// UNIFIED BULK EXPORT + PRINT
// ========================================

const exportUnifiedBulkBtn =
    document.getElementById("exportUnifiedBulkBtn");

const printUnifiedBulkBtn =
    document.getElementById("printUnifiedBulkBtn");


// Export Excel
if (exportUnifiedBulkBtn) {

    exportUnifiedBulkBtn.addEventListener("click", function () {

        if (unifiedBulkResults.length === 0) {

            alert("No bulk validation results available.");

            return;
        }

        let csvContent =
            "Sr No,Type,Document / Value,Status,Response\n";

        unifiedBulkResults.forEach((item, index) => {

            const responseText =
                JSON.stringify(item.Response)
                    .replace(/"/g, '""');

            csvContent +=
                `${index + 1},"${item.Type}","${item.Value}","${item.Status}","${responseText}"\n`;

        });

        const blob = new Blob(
            [csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            `Bulk_${bulkValidationType.value}_Validation_Report.csv`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    });

}


// Print Report
if (printUnifiedBulkBtn) {

    printUnifiedBulkBtn.addEventListener("click", function () {

        if (unifiedBulkResults.length === 0) {

            alert("No bulk validation results available.");

            return;
        }

        const printWindow = window.open(
            "",
            "_blank"
        );

        let tableRows = "";

        unifiedBulkResults.forEach((item, index) => {

            tableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.Type}</td>
                    <td>${item.Value}</td>
                    <td>${item.Status}</td>
                    <td>
                        ${JSON.stringify(item.Response)}
                    </td>
                </tr>
            `;

        });

        printWindow.document.write(`

            <html>

            <head>

                <title>Bulk Validation Report</title>

                <style>

                    body {
                        font-family: Arial, sans-serif;
                        padding: 30px;
                    }

                    h1 {
                        margin-bottom: 5px;
                    }

                    p {
                        color: #666;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 25px;
                    }

                    th,
                    td {
                        border: 1px solid #ccc;
                        padding: 10px;
                        text-align: left;
                    }

                    th {
                        background: #f2f2f2;
                    }

                </style>

            </head>

            <body>

                <h1>Bulk Validation Report</h1>

                <p>
                    Validation Type:
                    <strong>
                        ${bulkValidationType.value}
                    </strong>
                </p>

                <p>
                    Total Records:
                    <strong>
                        ${unifiedBulkResults.length}
                    </strong>
                </p>

                <table>

                    <thead>

                        <tr>
                            <th>#</th>
                            <th>Type</th>
                            <th>Document / Value</th>
                            <th>Status</th>
                            <th>Response</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${tableRows}

                    </tbody>

                </table>

            </body>

            </html>

        `);

        printWindow.document.close();

        printWindow.print();

    });

}

// ========================================
// UNIFIED BULK CSV + JSON DOWNLOAD
// ========================================

const downloadUnifiedCsvBtn =
    document.getElementById("downloadUnifiedCsvBtn");

const downloadUnifiedJsonBtn =
    document.getElementById("downloadUnifiedJsonBtn");


// ========================================
// DOWNLOAD CSV
// ========================================

if (downloadUnifiedCsvBtn) {

    downloadUnifiedCsvBtn.addEventListener("click", function () {

        if (!unifiedBulkResults || unifiedBulkResults.length === 0) {

            alert("No bulk validation results available.");

            return;
        }


        let csvContent =
            "Sr No,Type,Document / Value,Status,Response\n";


        unifiedBulkResults.forEach((item, index) => {

            const responseText =
                JSON.stringify(item.Response)
                    .replace(/"/g, '""');


            csvContent +=
                `"${index + 1}",` +
                `"${item.Type}",` +
                `"${item.Value}",` +
                `"${item.Status}",` +
                `"${responseText}"\n`;

        });


        const blob = new Blob(
            [csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;


        link.download =
            `Bulk_${bulkValidationType.value}_Validation.csv`;


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    });

}


// ========================================
// DOWNLOAD JSON
// ========================================

if (downloadUnifiedJsonBtn) {

    downloadUnifiedJsonBtn.addEventListener("click", function () {

        if (!unifiedBulkResults || unifiedBulkResults.length === 0) {

            alert("No bulk validation results available.");

            return;
        }


        const jsonData =
            JSON.stringify(
                unifiedBulkResults,
                null,
                2
            );


        const blob = new Blob(
            [jsonData],
            {
                type: "application/json"
            }
        );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;


        link.download =
            `Bulk_${bulkValidationType.value}_Validation.json`;


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    });

}