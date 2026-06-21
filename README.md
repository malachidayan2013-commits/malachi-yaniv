# מלאכי - יניב

גרסה מוכנה להעלאה ל-GitHub ול-Render.

## הרצה מקומית

```cmd
npm.cmd run install:all
```

חלון ראשון:

```cmd
cd server
npm.cmd run dev
```

חלון שני:

```cmd
cd client
npm.cmd run dev
```

פתיחה בדפדפן:

```text
http://localhost:5173
```

## העלאה ל-Render

הפרויקט כולל `render.yaml` בשורש התיקייה.
Render יריץ:

```cmd
npm run install:all && npm run build
```

ואז:

```cmd
npm start
```
