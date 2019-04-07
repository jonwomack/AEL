var config = {
    apiKey: "AIzaSyCbUoec8Hr-DtnUk1srWlpRpGEZycTgBHI",
    authDomain: "arworldgt.firebaseapp.com",
    databaseURL: "https://arworldgt.firebaseio.com",
    projectId: "arworldgt",
    storageBucket: "gs://arworldgt.appspot.com/",
    messagingSenderId: "1007753558225"
};
firebase.initializeApp(config);
// Get a reference to
// the database service



function createFile() {
    let input = document.getElementById("avatar");
    let file = input.files[0];
    if (file != null) {
        firebase.storage().ref(`glb/${file.name}`).put(file).then(function (snapshot) {
            console.log('Uploaded a blob or file!');
        });
        demo.innerHTML = "File Uploaded";
    } else {
        demo.innerHTML = "No File";
    }

}

