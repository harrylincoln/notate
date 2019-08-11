export const retrieveUserData = () => window.localStorage.getItem('songData') ? JSON.parse(window.localStorage.getItem('songData')) : {
    appStep: 1
};

export const writeToSongData = (data) => window.localStorage.setItem('songData', JSON.stringify(data));