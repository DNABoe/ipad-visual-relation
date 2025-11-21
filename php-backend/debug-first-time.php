<?php


$db = Database::getInstance();

echo "<h1>First-Time Check Debug</h1>";

}
echo 
    $users = $db->fetchAll("SELECT user_id, email, name, role, created_at FROM users");
        echo "<p>No users found in database</p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        foreach ($users 
            echo "<td>" . htmlspecialchars($user['user_id']) . "</td>"
}

        }
    }
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";

echo "<p>Database: " . DB_NAME . "</p>";

echo "<form method='POST'>";
echo "<button type='submit' name='reset' value='1' style='background: red; color: white; padding: 10

    try {
        echo "<p style='color: green;'>✅ Deleted $count users. Refresh 
        echo "<p style='color: red;'>❌ Error deleting users: " . $e->
}




























?>
