GlobalToken = "";
GlobalStopApi = false;
window.onload = function () {
    document.getElementById("messageBody").value = getStorage("message") ? getStorage("message") : "";

    const imageArr = getStorage("imageArr");
    const addImage = document.getElementById("inputImage");

    if (imageArr.length > 0) {
        imageArr.forEach((imageUrl) => {
            const imageDisplay = createImageDisplay(imageUrl);
            const imageElement = createImageUrlInput(imageUrl, imageDisplay);
            const removeButton = createRemoveButton(imageElement);

            addImage.appendChild(imageElement);
            addImage.appendChild(removeButton);
            addImage.appendChild(imageDisplay);
        });
    }
};

const messageBodyOnchangeHandler = () => {
    const message = document.getElementById("messageBody").value;
    updateStorage({ message });
};

const stopRequest = () => {
    GlobalStopApi = true;
}


const addImage = () => {
    const imageDisplay = createImageDisplay();
    const imageElement = createImageUrlInput("", imageDisplay);
    const removeButton = createRemoveButton(imageElement, imageDisplay);
    const addImage = document.getElementById("inputImage");

    addImage.appendChild(imageElement);
    addImage.appendChild(removeButton);
    addImage.appendChild(imageDisplay);
};

const createImageUrlInput = (imageUrl = "", imageDisplayElement) => {
    const imageElement = document.createElement("input");
    imageElement.className = "form-control mb-3 imageUrl";
    imageElement.value = imageUrl;
    imageElement.addEventListener("change", () => {
        imageDisplayElement.src = imageElement.value;
        updateImageArr();
    });

    return imageElement;
};

const createImageDisplay = (imageUrl = "") => {
    const imageElement = document.createElement("img");
    imageElement.src = imageUrl;
    imageElement.width = 200;
    imageElement.height = 200;
    imageElement.style.marginLeft = "20px";
    imageElement.className = "img-thumbnail mb-3";

    return imageElement;
}

const createRemoveButton = (imageElement, imageDisplay) => {
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.className = "btn btn-danger mb-3";
    removeButton.addEventListener("click", () => {
        imageElement.remove();
        imageDisplay.remove();
        removeButton.remove();
        updateImageArr();
    });

    return removeButton;
};

const updateImageArr = () => {
    const images = document.getElementsByClassName("imageUrl");
    const imageArr = Array.from(images).map((item) => item.value);
    updateStorage({ imageArr });
};

const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            jsonData.shift();
            resolve(jsonData);
        };
        reader.onerror = function (e) {
            reject(new Error("Failed to read file"));
        };
        reader.readAsArrayBuffer(file);
    });
};

const sendAll = async (event) => {
    GlobalStopApi = false;
    GlobalRetryCount = 0;
    event.preventDefault();
    const dataFile = document.getElementById("fileUpload").files[0];
    if (!dataFile) {
        alert("Please select an excel file");
        return;
    }
    const message = document.getElementById("messageBody").value;
    const images = document.getElementsByClassName("imageUrl");
    const imageArr = Array.from(images).map((item) => item.value);
    GlobalToken = await getStorage("token");
    const phoneNumber = await processExcelFile(dataFile);

    for (let i = 0; i < phoneNumber.length; i++) {
        await sendMessage(phoneNumber[i][0], message, imageArr);
        document.getElementById('progress').value = `${(i + 1)} / ${phoneNumber.length}`;
        if (GlobalStopApi) {
            return;
        }
    }
};
