

function validatePAN(value) {

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    return panRegex.test(value);

}


async function verifyPANWithAPI(pan) {
    try {
        const response = await fetch('/api/verify-pan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pan })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error calling PAN API:', error);
        return { success: false, error: 'Server se connect nahi ho paya' };
    }
}