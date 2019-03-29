<html>
  <head>
    <title>A quick test</title>
  </head>
  <body>
  <form action="/welcome.php" method="get">
  Username:<br>
  <input type="text" name="username" value="Mickey">
  <br>
  Password:<br>
  <input type="text" name="password" value="Mouse">
  <br><br>
  <input type="submit" value="Submit">
  </form>
  </body>



</html>


let objects = firebase.database().ref('/objects/');
    function writeObjectData(number, latitude, longitude, altitude, username, pub, color) {
        firebase.database().ref('/objects/' + number).set({
            longitude: longitude,
            latitude: latitude,
            altitude: altitude,
            username: username,
            public: pub,
            color: color
        });
    }


    function updateUserPosition(username, latitude, longitude, altitude, groups) {
        firebase.database().ref('users/' + username).set({
            latitude: latitude,
            longitude: longitude,
            altitude: altitude,
            groups: groups
        });
        firebase.database().ref('users/username' + groups).set({

        })
    }