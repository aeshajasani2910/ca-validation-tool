

let aadhaarCaptchaTxnId = null;
let aadhaarOtpTxnId = null;




async function generateAadhaarCaptcha() {

    try {

        const response = await fetch("/api/aadhaar/generate-captcha", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Captcha generation failed");
        }

        const data = result.data.data;

        aadhaarCaptchaTxnId = data.transactionId;

        showAadhaarCaptcha(data.imageUrl);

        return data;

    } catch (error) {

        console.error("Aadhaar Captcha Error:", error);

        alert("Unable to generate Aadhaar captcha. Please try again.");

        throw error;
    }
}




function showAadhaarCaptcha(imageUrl) {

    let captchaBox = document.getElementById("aadhaarCaptchaBox");

    if (!captchaBox) {

        captchaBox = document.createElement("div");

        captchaBox.id = "aadhaarCaptchaBox";

        captchaBox.className = "mt-3 p-3 border rounded";

        document.getElementById("inputValue")
            .parentElement
            .appendChild(captchaBox);
    }

    captchaBox.innerHTML = `

        <label class="form-label">
            Aadhaar Captcha
        </label>

        <div class="mb-3">

            <img
                src="${imageUrl}"
                alt="Aadhaar Captcha"
                style="
                    max-width:260px;
                    height:auto;
                    border:1px solid #ddd;
                    border-radius:8px;
                "
            >

        </div>

        <div class="input-group mb-3">

            <input
                type="text"
                id="aadhaarCaptcha"
                class="form-control"
                placeholder="Enter captcha"
                autocomplete="off"
            >

            <button
                type="button"
                class="btn btn-outline-primary"
                onclick="generateAadhaarCaptcha()"
            >
                <i class="bi bi-arrow-clockwise"></i>
                Refresh
            </button>

        </div>

    `;
}



async function generateAadhaarOTP(aadhaarNumber, captchaValue) {

    try {

        if (!aadhaarCaptchaTxnId) {

            throw new Error(
                "Captcha transaction ID is missing."
            );
        }

        const response = await fetch("/api/aadhaar/generate-otp", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                aadhaarNumber: aadhaarNumber,

                captchaTxnId: aadhaarCaptchaTxnId,

                captchaValue: captchaValue

            })

        });

        const result = await response.json();

        if (!result.success) {

            throw new Error(
                result.error || "OTP generation failed"
            );

        }

        const data = result.data.data;

        aadhaarOtpTxnId = data.txnId;

        showAadhaarOTPBox();

        return data;

    } catch (error) {

        console.error("Aadhaar OTP Error:", error);

        alert(
            error.message ||
            "Unable to generate Aadhaar OTP."
        );

        throw error;
    }
}




function showAadhaarOTPBox() {

    let otpBox = document.getElementById("aadhaarOtpBox");

    if (!otpBox) {

        otpBox = document.createElement("div");

        otpBox.id = "aadhaarOtpBox";

        otpBox.className = "mt-3 p-3 border rounded";

        document.getElementById("inputValue")
            .parentElement
            .appendChild(otpBox);
    }

    otpBox.innerHTML = `

        <label class="form-label">
            Aadhaar OTP
        </label>

        <input
            type="text"
            id="aadhaarOtp"
            class="form-control mb-3"
            maxlength="6"
            placeholder="Enter 6 digit OTP"
            inputmode="numeric"
            autocomplete="one-time-code"
        >

        <button
            type="button"
            class="btn btn-success"
            id="downloadAadhaarBtn"
        >

            <i class="bi bi-download"></i>

            Verify OTP & Download Aadhaar

        </button>

    `;


    document
        .getElementById("downloadAadhaarBtn")
        .addEventListener(
            "click",
            downloadAadhaar
        );
}



async function downloadAadhaar() {

    const aadhaarNumber =
        document.getElementById("inputValue")
            .value
            .trim();

    const otp =
        document.getElementById("aadhaarOtp")
            .value
            .trim();


    if (!/^\d{12}$/.test(aadhaarNumber)) {

        alert("Please enter a valid 12 digit Aadhaar number.");

        return;
    }


    if (!/^\d{6}$/.test(otp)) {

        alert("Please enter a valid 6 digit OTP.");

        return;
    }


    if (!aadhaarOtpTxnId) {

        alert(
            "OTP transaction is missing. Please generate OTP again."
        );

        return;
    }


    try {

        const button =
            document.getElementById(
                "downloadAadhaarBtn"
            );

        button.disabled = true;

        button.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
            Downloading...
        `;


        const response = await fetch(
            "/api/aadhaar/download",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    aadhaarNumber: aadhaarNumber,

                    otp: otp,

                    otpTxnId: aadhaarOtpTxnId

                })

            }
        );


        const result = await response.json();


        if (!result.success) {

            throw new Error(
                result.error ||
                "Aadhaar download failed"
            );

        }


        const data = result.data.data;


        document.getElementById(
            "resultStatus"
        ).innerHTML =
            "✅ Aadhaar Downloaded";


        document.getElementById(
            "resultMessage"
        ).innerHTML = `

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


        document.getElementById(
            "resultCard"
        ).style.display = "block";


        document.getElementById(
            "resultCard"
        ).style.borderLeft =
            "5px solid green";


        if (typeof addHistory === "function") {

            addHistory(
                "Aadhaar",
                maskAadhaar(aadhaarNumber),
                "Downloaded"
            );

        }


    } catch (error) {

        console.error(
            "Aadhaar Download Error:",
            error
        );


        document.getElementById(
            "resultStatus"
        ).innerHTML =
            "❌ Download Failed";


        document.getElementById(
            "resultMessage"
        ).innerHTML =
            error.message ||
            "Unable to download Aadhaar.";


        document.getElementById(
            "resultCard"
        ).style.display =
            "block";


        document.getElementById(
            "resultCard"
        ).style.borderLeft =
            "5px solid red";


    } finally {

        const button =
            document.getElementById(
                "downloadAadhaarBtn"
            );

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="bi bi-download"></i>
                Verify OTP & Download Aadhaar
            `;
        }
    }
}


function maskAadhaar(aadhaar) {

    if (!aadhaar || aadhaar.length !== 12) {

        return "XXXXXXXXXXXX";
    }

    return (
        aadhaar.substring(0, 4) +
        "XXXX" +
        aadhaar.substring(8)
    );
}




function validateAadhaar(value) {

    const aadhaarRegex = /^\d{12}$/;

    return aadhaarRegex.test(value);

}