require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();


// CHROMIUM + GOOGLE CHROME ACCESS

const ALLOWED_BROWSER = 'CA-VALIDATION-CHROMIUM';

app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';

    const isAuthorizedChromium =
        userAgent.includes(ALLOWED_BROWSER);

    const isGoogleChrome =
        userAgent.includes('Chrome') &&
        !userAgent.includes('Edg') &&
        !userAgent.includes('OPR');

    if (!isAuthorizedChromium && !isGoogleChrome) {
        return res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Browser Not Supported</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f5f5f5;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }

                    .box {
                        background: white;
                        padding: 40px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                        max-width: 500px;
                    }

                    h1 {
                        color: #dc3545;
                    }

                    p {
                        color: #555;
                        font-size: 17px;
                    }
                </style>
            </head>

            <body>
                <div class="box">
                    <h1>⚠️ Browser Not Supported</h1>

                    <p>
                        CA Validation Tool can only be accessed
                        using Google Chrome or the authorized Chromium browser.
                    </p>

                    <p>
                        Please open this application in Chrome or Chromium.
                    </p>
                </div>
            </body>
            </html>
        `);
    }

    next();
});

// Static files
app.use(express.static(__dirname));


app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.use(express.json());

app.use(express.json());  


app.post('/api/verify-pan', async (req, res) => {
  const { pan } = req.body;

  if (!pan) {
    return res.status(400).json({ success: false, error: 'PAN number required' });
  }

  try {
    const response = await axios.post(
      'http://e-port-api.i-tax.in/new_traces_verify_pan',
      { pan }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.log("PAN API ERROR DETAILS:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});




app.post('/api/verify-tan', async (req, res) => {

    const { tan } = req.body;

    if (!tan) {
        return res.status(400).json({
            success: false,
            error: 'TAN number required'
        });
    }

    try {

        const response = await axios.post(
            'https://traces-app.tdscpc.gov.in/registration/deductor/register/getPanByTanCode',

            {
                tanCode: tan.toUpperCase()
            },

            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cookie': process.env.TRACES_COOKIE
                },

                timeout: 30000
            }
        );

        console.log(
            'TRACES TAN STATUS:',
            response.status
        );

        console.log(
            'TRACES TAN RESPONSE:',
            response.data
        );

        
        if (
            response.status === 200 &&
            response.data &&
            response.data.data
        ) {

            const d = response.data.data;

            return res.json({

                success: true,

                data: {

                    tan: tan.toUpperCase(),

                    name:
                        d.nameAsPerTan || '',

                    pan:
                        d.panCode || '',

                    panName:
                        d.panName || '',

                    category:
                        d.category || '',

                    status:
                        response.data.message || 'Success'

                }

            });
        }

        return res.json({

            success: false,

            error:
                response.data?.message ||
                'TAN verification failed',

            data:
                response.data

        });

    } catch (error) {

        console.log(
            'TRACES TAN API ERROR:',
            error.response?.data ||
            error.message
        );

        return res.status(500).json({

            success: false,

            error:
                error.response?.data ||
                error.message

        });
    }

});

app.post('/api/verify-email', async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
    }

    try {

        const response = await axios.get(
            'https://emailreputation.abstractapi.com/v1/',
            {
                params: {
                    api_key: process.env.ABSTRACT_EMAIL_API_KEY,
                    email: email
                },
                timeout: 15000
            }
        );

        console.log("EMAIL VERIFY SUCCESS:", response.data);

        res.json({ success: true, data: response.data });

    } catch (error) {
        console.log("EMAIL VERIFY ERROR:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});



app.post('/api/verify-mobile', async (req, res) => {

    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number required' });
    }

    try {

        const response = await axios.get(
            'https://phoneintelligence.abstractapi.com/v1/',
            {
                params: {
                    api_key: process.env.ABSTRACT_PHONE_API_KEY,
                    phone: '+91' + phone
                },
                timeout: 15000
            }
        );

        console.log("MOBILE VERIFY SUCCESS:", response.data);

        res.json({ success: true, data: response.data });

    } catch (error) {
        console.log("MOBILE VERIFY ERROR:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});


app.get('/api/verify-gst/:gstin', async (req, res) => {
  const { gstin } = req.params;
  try {
    const response = await axios.get(
      `https://${process.env.GST_RAPIDAPI_HOST}/v1/gstin/${gstin}/details`,
      {
        headers: {
          'x-rapidapi-host': process.env.GST_RAPIDAPI_HOST,
          'x-rapidapi-key': process.env.GST_RAPIDAPI_KEY
        }
      }
    );
    res.json({ success: true, data: response.data });
 } catch (error) {
    console.log("ERROR DETAILS:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});



app.get('/api/gst-captcha', async (req, res) => {
  try {
    const response = await axios.get(
      'https://taxfileposterapi.myeventz.in/gst_info/captcha',
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    );
    console.log("GST CAPTCHA SUCCESS - keys received:", Object.keys(response.data || {}));
    res.json({ success: true, data: response.data });
  } catch (error) {
    const detail = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    };
    console.log("GST CAPTCHA ERROR:", detail);
    res.status(502).json({ success: false, error: detail });
  }
});


app.post('/api/gst-info', async (req, res) => {
  const { gstNumber, captcha, cookies } = req.body;

  if (!gstNumber || !captcha || !cookies) {
    return res.status(400).json({ success: false, error: 'gstNumber, captcha and cookies required' });
  }

  try {
    const response = await axios.post(
      'https://taxfileposterapi.myeventz.in/gst_info/info',
      { gstNumber, captcha, cookies }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.log("GST INFO ERROR:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});





const AADHAAR_API_BASE =
  'https://taxfileposterapi.myeventz.in';



app.post('/api/aadhaar/generate-captcha', async (req, res) => {

    try {

        const response = await axios.post(
            `${AADHAAR_API_BASE}/aadhaar/generate-captcha`,
            {},
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(
            "AADHAAR CAPTCHA SUCCESS:",
            response.data
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {

        console.log(
            "AADHAAR CAPTCHA ERROR:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            error:
                error.response?.data ||
                error.message
        });
    }
});




app.post('/api/aadhaar/generate-otp', async (req, res) => {

    const {
        aadhaarNumber,
        captchaTxnId,
        captchaValue
    } = req.body;


    if (
        !aadhaarNumber ||
        !captchaTxnId ||
        !captchaValue
    ) {

        return res.status(400).json({
            success: false,
            error:
                'aadhaarNumber, captchaTxnId and captchaValue are required'
        });
    }


    try {

        const response = await axios.post(
            `${AADHAAR_API_BASE}/aadhaar/generate-otp`,
            {
                aadhaarNumber,
                captchaTxnId,
                captchaValue
            },
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );


        console.log(
            "AADHAAR OTP SUCCESS:",
            response.data
        );


        res.json({
            success: true,
            data: response.data
        });


    } catch (error) {

        console.log(
            "AADHAAR OTP ERROR:",
            error.response?.data ||
            error.message
        );


        res.status(500).json({
            success: false,
            error:
                error.response?.data ||
                error.message
        });
    }
});




app.post('/api/aadhaar/download', async (req, res) => {

    const {
        aadhaarNumber,
        otp,
        otpTxnId
    } = req.body;


    if (
        !aadhaarNumber ||
        !otp ||
        !otpTxnId
    ) {

        return res.status(400).json({
            success: false,
            error:
                'aadhaarNumber, otp and otpTxnId are required'
        });
    }


    try {

        const response = await axios.post(
            `${AADHAAR_API_BASE}/aadhaar/download`,
            {
                aadhaarNumber,
                otp,
                otpTxnId
            },
            {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );


        console.log(
            "AADHAAR DOWNLOAD SUCCESS:",
            response.data
        );


        res.json({
            success: true,
            data: response.data
        });


    } catch (error) {

        console.log(
            "AADHAAR DOWNLOAD ERROR:",
            error.response?.data ||
            error.message
        );


        res.status(500).json({
            success: false,
            error:
                error.response?.data ||
                error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`CA Validation Server running on port ${PORT}`);
});