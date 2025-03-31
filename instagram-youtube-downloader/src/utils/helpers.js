// src/utils/helpers.js

const isValidUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(instagram\.com|youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
};

const extractVideoIdFromYoutubeUrl = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const extractPostIdFromInstagramUrl = (url) => {
    const regex = /instagram\.com\/p\/([^\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

module.exports = {
    isValidUrl,
    extractVideoIdFromYoutubeUrl,
    extractPostIdFromInstagramUrl,
};