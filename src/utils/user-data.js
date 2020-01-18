export const retrieveUserData = () => window.localStorage.getItem('userData') !== null ? JSON.parse(window.localStorage.getItem('userData')) : {
    appStep: 0,
    userKey: 'C'
};

export const writeToUserData = (data) => window.localStorage.setItem('userData', JSON.stringify(data));