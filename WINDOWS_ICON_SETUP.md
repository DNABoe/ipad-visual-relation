# Setting Up Custom Icon for .enc.releye Files in Windows

Windows doesn't automatically recognize custom file extensions like `.enc.releye`, so you'll need to manually configure the file association and icon. Follow these steps:

### Step 1: Download the Icon File

3. Go to the **About** tab

### Step 1: Download the Icon File

1. Open RelEye application
2. Click the **Settings** button (gear icon in toolbar)
3. Go to the **About** tab
4. Scroll down to "Windows File Icon"
5. Click **"Download Windows Icon (.ico)"**
6. Save the icon to a permanent location (e.g., `C:\Icons\releye-icon.ico`)
2. Right-click on "Classes" → **New** → **Key**

6. With "DefaultIcon" selected, double-click "(D



2. Find "Windows Explorer" in the list






2. Right-click any `.enc.releye

6. Navigate to any program (e.g., `C:\Windows\notepad.exe`)
2. Right-click on "Classes" → **New** → **Key**
3. Name it: `RelEyeFile`
4. Right-click on "RelEyeFile" → **New** → **Key**
5. Name it: `DefaultIcon`
6. With "DefaultIcon" selected, double-click "(Default)" in the right pane
7. Set value to the full path of your icon file: `C:\Icons\releye-icon.ico`
8. Click OK
9. Close Registry Editor

### Step 4: Refresh Explorer

1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find "Windows Explorer" in the list
3. Right-click it and select **Restart**

Your `.enc.releye` files should now display the custom RelEye icon!

---

## Method 2: Using File Properties (Simpler, but Limited)

This method is simpler but may not work in all Windows versions and might not persist across updates.

### Steps:

1. Download the icon file (see Method 1, Step 1)
2. Right-click any `.enc.releye` file
3. Select **"Open with"** → **"Choose another app"**
4. Click **"More apps"**
5. Scroll down and click **"Look for another app on this PC"**
### Will this work on Mac or Linux?
- **Mac**: macOS doesn't use the file extension for icons. T




3. 























































### Will this work on Mac or Linux?






## Need Help?

If you're still having trouble, try:
1. Restarting your computer after making changes
2. Using Method 1 (Registry) as it's the most reliable
3. Making sure no other program has claimed the `.enc.releye` extension

The icon setup is optional - it just makes your files easier to identify in Windows Explorer. RelEye will work perfectly fine without it!
