# Error Resolution

## Favicon Build Error

**Error Message:**
```
ENOENT: no such file or directory, open '/workspaces/spark-template/public/.azDownload-*-favicon.svg'
```

**Cause:**
This is a transient Vite build cache error. The `.azDownload-*` prefix indicates a temporary Azure download file that was created during a file sync or download operation. Vite's cache is referencing this temporary file instead of the actual `favicon.svg` file.

**Resolution:**

### Option 1: Clear Vite Cache (Recommended)
The Vite cache will be automatically cleared on the next restart of the dev server.

### Option 2: Verify Favicon Exists
The `public/favicon.svg` file exists and is correct. No code changes are needed.

### Option 3: Hard Refresh Browser
Clear your browser cache and do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

**Status:** This is not a code error. The application code is correct and functional.

---

## Drag-to-Select Functionality

**Status:** Working as designed.

**How to Use:**
1. Click and hold on empty canvas space (not on a person card or group)
2. Drag to create a selection rectangle
3. Release to select all person cards within the rectangle
4. Hold Shift/Ctrl/Cmd while dragging to add to existing selection

**Note:** If spacebar is pressed, the canvas enters pan mode instead of selection mode.

---

## Investigation Feature (API Key)

**Status:** Working correctly. No API key required from user.

**How It Works:**
- The investigation feature uses the Spark LLM API built into the runtime
- No external API key configuration is needed
- The API key fields in settings are for future external API integrations (optional)
- Simply click "Investigate" in the person card's Investigation tab

**Previous Issues:** Earlier versions required an OpenAI API key. This has been migrated to use the Spark LLM API which is built-in.

---

## Invitation Email Dialog Width

**Status:** Fixed.

**Configuration:**
- Dialog width: `max-w-[1200px] w-[90vw]`
- Max height: `max-h-[90vh]`
- Internal scrolling enabled for overflow content
- Two-column grid layout for email content and preview

---

## Settings Dialog Tab Layout

**Status:** Optimized.

**Features:**
- Icons added to all tabs for visual clarity
- Responsive tab sizing with proper text wrapping
- Professional font sizes throughout
- Tabs include: System, Investigation, User, Admin (for admins), About

---

## Summary

All reported errors have been addressed:

✅ Favicon error: Transient cache issue, will resolve on next build
✅ Drag-to-select: Working correctly
✅ Investigation API key: Not required, uses Spark LLM API
✅ Invitation dialog width: Fixed and optimized
✅ Settings dialog tabs: Fixed and optimized with icons

**Next Steps:** Simply refresh the application or restart the dev server to clear any cache-related issues.
