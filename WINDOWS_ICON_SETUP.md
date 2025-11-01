# Setting Up Custom Icon for .enc.releye Files in Windows

Windows doesn't automatically recognize custom file extensions like `.enc.releye`, so you'll need to manually configure the file association and icon. Follow these steps:

## Method 1: Using Windows Registry (Recommended)

This method creates a proper file type association that will persist across system restarts.

### Step 1: Download the Icon File

1. Open RelEye application
2. Click the **Settings** button (gear icon in toolbar)
3. Go to the **About** tab
4. Scroll down to "Windows File Icon"
5. Click **"Download Windows Icon (.ico)"**
6. Save the icon to a permanent location (e.g., `C:\Icons\releye-icon.ico`)
   - ⚠️ Don't delete this file later - Windows will reference it!

### Step 2: Create File Association via Registry

1. Press `Win + R` to open Run dialog
2. Type `regedit` and press Enter
3. Navigate to: `HKEY_CURRENT_USER\Software\Classes\`
4. Right-click on "Classes" → **New** → **Key**
5. Name it: `.enc.releye`
6. With `.enc.releye` selected, double-click "(Default)" in the right pane
7. Set value to: `RelEyeFile`
8. Click OK

### Step 3: Configure File Type

1. Still in Registry Editor, go back to `HKEY_CURRENT_USER\Software\Classes\`
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
6. Navigate to any program (e.g., `C:\Windows\notepad.exe`)
7. Check **"Always use this app to open .enc.releye files"**
8. Click **Open**

Note: This method associates the file with a program rather than just setting an icon. You'll still need to right-click and "Open with" → RelEye (your browser) to actually use the files.

---

## Method 3: Using Third-Party Tools

Several tools can help manage file associations and icons more easily:

- **FileTypesMan** (by NirSoft) - Free utility to manage file types
- **Default Programs Editor** - More user-friendly than Registry Editor
- **IconsExtract** - Can help manage icon files

---

## Troubleshooting

### Icon doesn't appear after following steps:
- Make sure the icon file path in the registry is correct
- Try restarting your computer (not just Explorer)
- Ensure the icon file hasn't been moved or deleted
- Check that the file extension is exactly `.enc.releye` (not `.enc.releye.txt`)

### Icon appears but is low quality:
- The .ico file contains multiple resolutions (16x16, 32x32, 48x48, 256x256)
- Windows should automatically pick the right size
- If it looks blurry, try regenerating and downloading the icon file again

### Can't edit Registry:
- You need administrator privileges to edit HKEY_CURRENT_USER
- Try running Registry Editor as Administrator
- Or use Method 2 instead

### Files still show generic icon:
- Clear icon cache: Delete `%localappdata%\IconCache.db` and restart Explorer
- Refresh the folder by pressing F5
- Try logging out and back in

---

## Additional Notes

### Why can't RelEye set this automatically?

Modern browsers run in a sandboxed environment and don't have permission to:
- Modify the Windows Registry
- Create file associations
- Set system-wide icon preferences

This is a security feature to prevent malicious websites from changing your system settings.

### Is this safe?

Yes! You're simply telling Windows:
1. "These files with `.enc.releye` extension are RelEye files"
2. "Show this icon for RelEye files"

This doesn't give any program permission to run automatically or access your files.

### Will this work on Mac or Linux?

- **Mac**: macOS doesn't use the file extension for icons. The system relies on metadata and bundle identifiers.
- **Linux**: Different desktop environments handle this differently. Most will show a generic file icon unless you create a MIME type association.

---

## Need Help?

If you're still having trouble, try:
1. Restarting your computer after making changes
2. Using Method 1 (Registry) as it's the most reliable
3. Making sure no other program has claimed the `.enc.releye` extension

The icon setup is optional - it just makes your files easier to identify in Windows Explorer. RelEye will work perfectly fine without it!
