GlobalRetryCount = 0;
const getStorage = (key) => {
    const storage = localStorage.getItem('thuyOpenPhone');
    if (!storage) {
        return '';
    }
    return JSON.parse(storage)[key];
};

const getToken = async () => {
    try {
        const result = await axios.post('https://auth.openphoneapi.com/v2/signin/refresh', {
            refreshToken: 'nNGFQ9iQ_Xu_uoPC9O7p-q8oQP0kQmSPRVJr5-I8ETTL3'
        });
        updateStorage({ token: result.data.id_token });
        return result.data.id_token;
    } catch (error) {
        throw error;
    }
};

const updateStorage = (variable) => {
    const storage = localStorage.getItem('thuyOpenPhone');
    const updatedStorage = { ...JSON.parse(storage), ...variable };
    localStorage.setItem('thuyOpenPhone', JSON.stringify(updatedStorage));
};

const sendMessage = async (phone, message, imageUrls = []) => {
    const mediaUrl = imageUrls.map((imageUrl) => ({ url: imageUrl }));
    try {
        await axios.post('https://communication.openphoneapi.com/v2/conversation', {
            phoneNumberId: 'PNjmaVoihP',
            to: phone,
            body: message,
            mediaUrl
        }, {
            headers: {
                authorization: GlobalToken
            }
        });
        return 'success';
    } catch (error) {
        if (error.response.status == 401) {
            const MAX_RETRY = 2;
            const retrySendMessage = async (phone, message, imageUrls) => {
                if (GlobalRetryCount >= MAX_RETRY) {
                    alert('Maximum retry limit reached');
                    throw new Error('Maximum retry limit reached');
                }
                GlobalRetryCount++;
                // Retry by calling getToken
                GlobalToken = await getToken();
                // Retry the sendMessage function
                return sendMessage(phone, message, imageUrls);
            };

            // Call retrySendMessage instead of sendMessage
            return retrySendMessage(phone, message, imageUrls);
        }
        else if (error.response.status == 400) {
            if (error.response.data.message == 'US A2P 10DLC - Daily Message Cap Reached') {
                return;
            }
            else if (error.response.data.message == 'Attempt to send to unsubscribed recipient') {
                return;
            }
            else {
                alert(error.response.data.message);
                throw new Error('App stopped');
            }
        }
        else {
            alert(error.response.data.message);
            throw new Error('App stopped');
        }

    }
};
