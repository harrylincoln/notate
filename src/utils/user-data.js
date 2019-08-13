export const retrieveUserData = () => window.localStorage.getItem('userData') ? JSON.parse(window.localStorage.getItem('userData')) : {
    appStep: 0
};

export const writeToUserData = (data) => window.localStorage.setItem('userData', JSON.stringify(data));