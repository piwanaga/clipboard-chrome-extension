// Listen for messages received from backend (background.js). If message received, check message text and perform action.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_all_success") {
        if (request.payload) {
            request.payload.forEach(link => {
                addEntry(link.title, link.copyText)
            })   
        }
    } else if (request.message === "insert_success") {
        if (request.payload) {
            addEntry(request.payload.title, request.payload.copyText)

            // Reset the inputs 
            titleInput.value = ""
            copyTextInput.value = ""
        }
    } else if (request.message === "delete_success") {
        if (request.payload) {

            // Remove linkGroup from DOM
            recordToDelete.remove()
        }
    }
})

// Send message to backend to retrieve all records from database
chrome.runtime.sendMessage({
    message: "get_all",
})

// Select elements on the page for DOM manipulation
const main = document.getElementById("main")
const addForm = document.getElementById("add-form")
const titleInput = document.getElementById("title-input")
const copyTextInput = document.getElementById("copy-text-input")

// Listen for form submit
addForm.addEventListener("submit", (evt) => {
    evt.preventDefault()

    const formData = new FormData(addForm)

    // Send message and data to backend to insert new record into database 
    chrome.runtime.sendMessage({
        message: "insert",
        payload: {
            "title": formData.get("title"),
            "copyText": formData.get("copy-text")
        }
    })
})

// Global variable to store the node with the currently copied text. Used to remove confirmation when another link is clicked
let confirmed

// Copy text on click
const addCopyEventListener = (inputGroup, copyText) => {
    
    // Create confirmation text element
    const confirmationText = document.createElement("p")
    confirmationText.classList.add('confirmation-text')
    confirmationText.innerText = "Copied!"
    
    inputGroup.addEventListener("click", () => {
        // Remove confirmation text from previously copied link
        if (confirmed) confirmed.remove()

        // Copy text to clipboard
        navigator.clipboard.writeText(copyText.innerText)

        // Add confirmation text after copy text and before delete button
        inputGroup.insertBefore(confirmationText, inputGroup.lastChild)

        // Set confirmed to new node
        confirmed = confirmationText
    })
}

// Global variable representing DOM element to be removed. The variable can be set when the delete button is clicked. Once confirmation is received that the record has been deleted from the database, the element can be removed from the DOM, from inside of the chrome.runtime.onMessage.addListener
let recordToDelete

// Delete record on click
const addDeleteEventListener = () => {
    const deleteBtns = document.getElementsByClassName("delete-btn");

    for (let btn of deleteBtns) {
        btn.addEventListener("click", () => {
            // Set variable so that it can be removed inside of chrome.runtime.onMessage.addListener 
            recordToDelete = btn.parentElement

            // Get title text
            let titleText = btn.parentElement.firstChild.innerText

            // Save title without ": " 
            title = titleText.slice(0, titleText.length - 1)
            
            // Send message to backened to trigger delete action and payload with title used to look up the record in the database
            chrome.runtime.sendMessage({
                message: "delete",
                payload: title
            })
        })
    }
}

// Generate HTML for new record
const addEntry = (titleText, textToCopy) => {
    const inputGroup = document.createElement("div")
    const title = document.createElement("p")
    const copyText = document.createElement("p")
    const deleteBtn = document.createElement("button")

    title.innerText = titleText + ": "
    copyText.innerText = textToCopy
    deleteBtn.innerText = "Delete"

    inputGroup.classList.add("input-group")
    title.classList.add("title")
    copyText.classList.add("copy-text")
    deleteBtn.classList.add("delete-btn")

    inputGroup.appendChild(title)
    inputGroup.appendChild(copyText)
    inputGroup.appendChild(deleteBtn)

    main.appendChild(inputGroup)

    addCopyEventListener(inputGroup, copyText)
    addDeleteEventListener()
}








