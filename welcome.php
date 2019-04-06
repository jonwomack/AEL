<html>
<body>

 <?php
   class MyDB extends SQLite3 {
      function __construct() {
         $this->open('test.db');
      }
   }
   $db = new MyDB();
   if(!$db) {
      echo $db->lastErrorMsg();
   } else {
  }
$query = $db->query('SELECT user_name, password FROM users LIMIT 25'); // buffered result set

 $result = resultSetToArray($query);
 $loggedIn = false;
foreach ($result as $entry) {
 if( $entry['user_name'] == $_GET["username"] && $entry['password'] == $_GET["password"]) {
 header('Location: index.html');
 $loggedIn = true;
 exit;
 }
 }
 if ($loggedIn !== true) {
     header('Location: test.php');
     exit;
 }





  function resultSetToArray($queryResultSet) {
    $multiArray = array();
    $count = 0;
    while($row = $queryResultSet->fetchArray(SQLITE3_ASSOC)){
        foreach($row as $i=>$value) {
            $multiArray[$count][$i] = $value;
        }
        $count++;
    }
    return $multiArray;
}
  ?>

</body>
</html>
