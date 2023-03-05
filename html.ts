const page = 17;

// Read image and svg files
const bg = `./output/${page}.jpeg`;
const svg = `./output/${page}.svg`;

// Create HTML page with image background and embedded svg
const html = `
<!DOCTYPE html>
<html>

<head>
    <title>Microbiologia pagina ${page}</title>
    <style>
        html,
        body {
            height: 100%;
            margin: 0;
            padding: 0;
        }

        .background {
            position: relative;
            height: 100%;
            width: 100%;
        }

        .background img,object {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    </style>
</head>

<body>
    <div class="background">
        <img draggable="false" src="${bg}">
        <object type="image/svg+xml" data="${svg}"></object>
    </div>
</body>

</html>
`;

// Write HTML page to file
Deno.writeTextFileSync('index.html', html);
