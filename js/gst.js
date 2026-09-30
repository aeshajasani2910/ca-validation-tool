

function validateGST(value) {

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    return gstRegex.test(value);

}


function validateGST(value) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(value);
}


async function verifyGSTWithAPI(gstin) {
    try {
        const response = await fetch(`/api/verify-gst/${gstin}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error calling GST API:', error);
        return { success: false, error: 'Server se connect nahi ho paya' };
    }
}