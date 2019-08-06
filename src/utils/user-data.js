export const retrieveUserData = () => window.localStorage.getItem('songData') ? JSON.parse(window.localStorage.getItem('songData')) : {
    appStep: 0
};

export const writeToSongData = (data) => window.localStorage.setItem('songData', JSON.stringify(data));