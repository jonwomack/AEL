<?php phpinfo(); ?>


<?php
/* Connect to a MySQL database using driver invocation */
$dsn = 'sqlite:User/jonwomack/.bitnami/stackman/machines/xampp/volumes/root/htdocs/data/test.sqlite3';


$result = $db->query('SELECT * FROM users');
var_dump($result->fetchArray());