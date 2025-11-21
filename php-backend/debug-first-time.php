<?php
require_once 'helpers.php';

$db = Database::getInstance();

echo "<h1>First-Time Check Debug</h1>";

echo "<h2>1. Check admin users count</h2>";
try {
    $result = $db->fetchOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    echo "<p>Admin count: " . $result['count'] . "</p>";
    echo "<p>isFirstTime should be: " . ($result['count'] == 0 ? 'TRUE' : 'FALSE') . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<h2>2. All users in database</h2>";
try {
    $users = $db->fetchAll("SELECT user_id, email, name, role, created_at FROM users");
    if (empty($users)) {
        echo "<p>No users found in database</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>User ID</th><th>Email</th><th>Name</th><th>Role</th><th>Created At</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($user['user_id']) . "</td>";
            echo "<td>" . htmlspecialchars($user['email']) . "</td>";
            echo "<td>" . htmlspecialchars($user['name']) . "</td>";
            echo "<td>" . htmlspecialchars($user['role']) . "</td>";
            echo "<td>" . htmlspecialchars($user['created_at']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<h2>3. Database connection info</h2>";
echo "<p>Database: " . DB_NAME . "</p>";
echo "<p>Host: " . DB_HOST . "</p>";

echo "<h2>4. Delete ALL users (RESET)</h2>";
echo "<form method='POST'>";
echo "<p><strong>⚠️ WARNING: This will delete ALL users from the database!</strong></p>";
echo "<button type='submit' name='reset' value='1' style='background: red; color: white; padding: 10px 20px; font-size: 16px;'>DELETE ALL USERS</button>";
echo "</form>";

if (isset($_POST['reset'])) {
    try {
        $count = $db->execute("DELETE FROM users");
        echo "<p style='color: green;'>✅ Deleted $count users. Refresh page to verify.</p>";
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error deleting users: " . $e->getMessage() . "</p>";
    }
}
?>
