# 🎨 Easy Customization Guide

## Quick Color Changes

Want to change the accent color? Edit these variables in `style-modern.css`:

```css
:root {
    /* Change these colors to customize */
    --accent-blue: #3b82f6;      /* Main accent (buttons, links) */
    --accent-emerald: #10b981;   /* Success color (WhatsApp, confirm) */
    --bg-primary: #09090b;       /* Main background */
    --bg-secondary: #18181b;     /* Card backgrounds */
    --text-primary: #fafafa;     /* Main text */
    --text-secondary: #a1a1aa;   /* Secondary text */
}
```

## Popular Color Schemes

### 1. Purple Tech (Like Discord)
```css
--accent-blue: #5865f2;
--accent-emerald: #57f287;
```

### 2. Green Matrix
```css
--accent-blue: #00ff41;
--accent-emerald: #00ff41;
```

### 3. Orange Energy
```css
--accent-blue: #ff6b35;
--accent-emerald: #f7931e;
```

### 4. Cyan Modern
```css
--accent-blue: #06b6d4;
--accent-emerald: #14b8a6;
```

## Change Font

Replace this line in `style-modern.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

### Popular Alternatives:
- **Poppins**: `family=Poppins:wght@300;400;500;600;700;800`
- **Montserrat**: `family=Montserrat:wght@300;400;500;600;700;800`
- **Space Grotesk**: `family=Space+Grotesk:wght@300;400;500;600;700`

Then update:
```css
body {
    font-family: 'YOUR_FONT_NAME', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

## Adjust Border Radius

For sharper corners:
```css
/* Find and replace these values */
border-radius: 16px; /* Change to 8px or 4px */
border-radius: 12px; /* Change to 6px or 4px */
border-radius: 8px;  /* Change to 4px or 2px */
```

For rounder corners:
```css
border-radius: 16px; /* Change to 20px or 24px */
border-radius: 12px; /* Change to 16px or 20px */
border-radius: 8px;  /* Change to 12px or 16px */
```

## Change Background Pattern

### Remove Grid Pattern
Find this in `style-modern.css` and comment it out:
```css
body::before {
    /* content: ''; */
    /* ... rest of the code ... */
}
```

### Add Dots Instead of Grid
```css
body::before {
    background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
}
```

## Adjust Hover Effects

### Stronger Hover
```css
.product-card:hover {
    transform: scale(1.03); /* Was 1.01 */
    border-color: var(--accent-blue);
}
```

### Subtle Hover
```css
.product-card:hover {
    transform: scale(1.005); /* Was 1.01 */
}
```

## Change Button Style

### Rounded Pills
```css
.btn {
    border-radius: 999px; /* Full rounded */
}
```

### Sharp Edges
```css
.btn {
    border-radius: 4px; /* Sharp corners */
}
```

## Adjust Spacing

### Tighter Layout
```css
.container {
    width: min(1280px, 96%); /* Was 94% */
}

.product-grid {
    gap: 16px; /* Was 20px */
}
```

### Looser Layout
```css
.container {
    width: min(1280px, 90%); /* Was 94% */
}

.product-grid {
    gap: 24px; /* Was 20px */
}
```

## Quick Tips

1. **Test Changes**: Always refresh with `Ctrl+F5` to clear cache
2. **Backup**: Keep `style.css` as backup
3. **Browser DevTools**: Use F12 to test colors live
4. **Consistency**: Change all instances of a color for consistency

## Need Help?

- Colors not changing? Clear browser cache
- Layout broken? Check for missing semicolons
- Font not loading? Check Google Fonts URL

---

**Pro Tip**: Use browser DevTools (F12) to test changes live before editing the file!
