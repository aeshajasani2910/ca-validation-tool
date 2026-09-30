

function validateTAN(value) {

    const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

    return tanRegex.test(value);

}