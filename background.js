// Listen for messages received from frontend (popup.js). If message received, check message text and perform action.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_all") {
        
        if (db) {
            // Get all records from database
            let get_all_request = get_all_records()

            // Respond with message and payload -- an array of objects representing our database records.
            // Example payload:
            //     [{
            //         title: "LinkedIn",
            //         copyText: "www.linkedin.com/profile"
            //     },
            //     {
            //         title: "Portfolio",
            //         copyText: "www.portfolio.com"
            //     }] 
            get_all_request.then(res => {
                chrome.runtime.sendMessage({
                    message: "get_all_success",
                    payload: res
                })
            })

            // Return so that we do not send records a second time in create_database()
            return
        }
        
    } else if (request.message === "insert") {
        // Insert record from payload into database 
        let insert_request = insert_record(request.payload)

        //   Respond with message and an object representing the record that was inserted.
        //   Example payload:
        //     {
        //     title: "Github",
        //     copyText: "www.github.com/profile"     
        //     }
         
        insert_request.then(res => {
            chrome.runtime.sendMessage({
                message: "insert_success",
                payload: res
            })
        })
    } else if (request.message === "delete") {
        // Delete record from database using the title passed in request.payload. Title is the keyPath used to look up records in the database.
        let delete_request = delete_record(request.payload)
        
        // Delete record and return true or false depending on if deletion was successful
        delete_request.then(res => {
            chrome.runtime.sendMessage({
                message: "delete_success",
                payload: res
            })
        })
    }
})

let db = null
let storedLinks = []

const create_database = () => {
    // Use self instead of window because background.js is a service worker and does not have access to DOM
    const request = self.indexedDB.open("ClipboardDB")

    // Gets executed whenever a new database in opened or if a different version of an existing database is opened. Does not get executed otherwise. This is also where the schema is defined.
    request.onupgradeneeded = (event) => {
        db = event.target.result

        // Defines schema and keyPath, the value used to look up entries in DB.
        let objectStore = db.createObjectStore("links", {
            keyPath: "title"
        })

        objectStore.transaction.oncomplete = (event) => {
            console.log("ObjectStore Created.")
        }
    }

    // Always runs unless there is an error when opening database
    request.onsuccess = (event) => {
        // Set global db variable
        db = event.target.result
        console.log("DB Opened.")

        // On successful db opening, get all records. This is helpful when service worker is inactive because when the extension UI is opened, if the db has not yet been opened then the request from "get_all" from frontend will fail. If that happens, once the db is open the following code will run and the frontend will still receive all records from the db.
        
        if (db) {
            let get_all_request = get_all_records()
            get_all_request.then(res => {
                chrome.runtime.sendMessage({
                    message: "get_all_success",
                    payload: res
                })
            })
        }
    }

    request.onerror = event => {
        console.log("Error opening DB.")
    }
}

const delete_database = () => {
    const request = window.indexedDB.delete_database("ClipboardDB")

    request.onsuccess = (event) => {
        db = event.target.result

        console.log("DB Deleted.")
    }

    request.onerror = (event) => {
        console.log("Error deleting DB.")
    }
}

// Retrieve all records from database
const get_all_records = () => {
    if (db) {
        // Specify what table(s) this transaction will be affiliated with. In this case there is only one table. If there were more, an array of different table names could be used instead of just "links".
        const get_transaction = db.transaction("links", "readonly")
        
        // Specify which table to readwrite on
        const objectStore = get_transaction.objectStore("links")

        // Because database actions are asynchronous, a Promise is created  and if resolved, returns all the records from the database
        return new Promise((resolve, reject) => {
            get_transaction.oncomplete = () => {
                console.log("Get Transactions Complete.")
            }
    
            get_transaction.onerror = () => {
                console.log("Error getting records.")
            }
    
            let request = objectStore.getAll()
    
            request.onsuccess = (event) => {
                resolve(request.result)
            }
        })
    }
}

// Add new record to database
const insert_record = (record) => {
    if (db) {
        const insert_transaction = db.transaction("links", "readwrite")

        const objectStore = insert_transaction.objectStore("links")

        return new Promise((resolve, reject) => {
            insert_transaction.oncomplete = () => {
                console.log("Add Transactions Complete.")
            }
    
            insert_transaction.onerror = () => {
                console.log("Error adding records.")
            }
            
            let request = objectStore.add(record)
            // After adding record, retrieve the record and return it
            let newRecord = get_record(record.title)
            request.onsuccess = () => {
                console.log("Added: ", record)
                resolve(newRecord)
            }
        })
    }
}

// Get single record from database by title
const get_record = (title) => {
    if (db) {
        const get_transaction = db.transaction("links", "readonly")
        
        const objectStore = get_transaction.objectStore("links")

        return new Promise((resolve, reject) => {
            get_transaction.oncomplete = () => {
                console.log("Get Transaction Complete.")
            }
    
            get_transaction.onerror = () => {
                console.log("Error getting record.")
            }
    
            let request = objectStore.get(title)
            
            // Return record
            request.onsuccess = (event) => {
                resolve(event.target.result)
            }
        })
    }
}

// Update a record. For now, this is not being used.
// const update_record = (record) => {
//     if (db) {
//         const put_transaction = db.transaction("links", "readwrite")

//         const objectStore = put_transaction.objectStore("links")

//         return new Promise((resolve, rejct) => {
//             put_transaction.oncomplete = () => {
//                 console.log("Put Transactions Complete.")
//                 resolve(true)
//             }
    
//             put_transaction.onerror = () => {
//                 console.log("Error updating records.")
//                 resolve(false)
//             }
    
//             objectStore.put(record)
//         })
//     }
// }

// Delete record from database
const delete_record = (title) => {
    if (db) {
        const delete_transaction = db.transaction("links", "readwrite")

        const objectStore = delete_transaction.objectStore("links")

        return new Promise((resolve, reject) => {
            delete_transaction.oncomplete = () => {
                console.log("Delete Transactions Complete.")
                resolve(true)
            }
    
            delete_transaction.onerror = () => {
                console.log("Error deleting records.")
                resolve(false)
            }
    
            objectStore.delete(title)
        })
    }
}
console.log("test return")
create_database()










