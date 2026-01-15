
const extractContactInfoRobust = (bio) => {
    if (!bio) return { email: '', phone: '' };

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

    // Normalized match:
    // Remove all non-alphanumeric chars (keep +) to concatenate numbers
    const cleanBio = bio.replace(/[^a-zA-Z0-9+]/g, '');

    console.log(`Original: "${bio}"`);
    console.log(`Cleaned: "${cleanBio}"`);

    const phoneRegexStrict = /(?:\+?62|0)8\d{8,12}/g;

    const emails = bio.match(emailRegex);
    const phones = cleanBio.match(phoneRegexStrict);

    let phone = '';
    if (phones && phones.length > 0) {
        phone = phones[0];
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        } else if (phone.startsWith('+')) {
            phone = phone.substring(1);
        }
    } else {
        console.log('Strict match failed, trying loose...');
        const looseRegex = /(?:\+?62|0)\s?8\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,5}\b/g;
        const looseMatches = bio.match(looseRegex);
        if (looseMatches) {
            phone = looseMatches[0].replace(/[^0-9]/g, '');
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        }
    }

    return {
        email: emails ? emails[0].toLowerCase() : '',
        phone: phone
    };
};

const testCases = [
    "0877-7742-3787",
    "Call me at 0877-7742-3787",
    "WA: 0877 7742 3787",
    "Info 0812.3456.7890",
    "random text 628123456789 end"
];

testCases.forEach(input => {
    console.log('Result:', extractContactInfoRobust(input));
    console.log('---');
});
