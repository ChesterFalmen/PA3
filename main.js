'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTangentBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normal, tangent, texture) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangent), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTangent);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}

// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;

    this.iAttribNormal = -1;

    this.iLightPosition = -1;

    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iModelMatrixNormal = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-2, 2, -2, 2, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    let inversion = m4.inverse(modelViewProjection);
    let transposedModel = m4.transpose(inversion);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelMatrixNormal, false, transposedModel);
    gl.uniform3fv(shProgram.iLightPosition, [0.0, 1.0, 0.0]);

    surface.Draw();
}

function CreateSurfaceData(maxR, u = 0.01, v = 0.01) {
    let vertexList = [];
    let normalList = [];
    let textureList = [];
    let tangentList = [];
    // let step = 0.01;
    let delta = 0.001;

    for (let r = 0.25; r <= maxR; r += u) {
        for (let theta = 0; theta < 2 * Math.PI; theta += v) {

            let v1 = equations(r, theta);
            let v2 = equations(r, theta + v);
            let v3 = equations(r + u, theta);
            let v4 = equations(r + u, theta + v);

            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);

            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v3.x, v3.y, v3.z);

            let n1 = CalculateNormal(r, theta, delta);
            let n2 = CalculateNormal(r, theta + v, delta);
            let n3 = CalculateNormal(r + u, theta, delta);
            let n4 = CalculateNormal(r + u, theta + v, delta)

            let t1 = CalculateNormal(r, theta, delta, true);
            let t2 = CalculateNormal(r, theta + v, delta, true);
            let t3 = CalculateNormal(r + u, theta, delta, true);
            let t4 = CalculateNormal(r + u, theta + v, delta, true)

            normalList.push(n1.x, n1.y, n1.z);
            normalList.push(n2.x, n2.y, n2.z);
            normalList.push(n3.x, n3.y, n3.z);

            normalList.push(n2.x, n2.y, n2.z);
            normalList.push(n4.x, n4.y, n4.z);
            normalList.push(n3.x, n3.y, n3.z);

            tangentList.push(t1.x, t1.y, t1.z);
            tangentList.push(t2.x, t2.y, t2.z);
            tangentList.push(t3.x, t3.y, t3.z);

            tangentList.push(t2.x, t2.y, t2.z);
            tangentList.push(t4.x, t4.y, t4.z);
            tangentList.push(t3.x, t3.y, t3.z);

            t1 = [(r - 0.25) / (maxR - 0.25), theta / (2 * Math.PI)]
            t2 = [(r - 0.25) / (maxR - 0.25), (theta + v) / (2 * Math.PI)]
            t3 = [(r + u - 0.25) / (maxR - 0.25), theta / (2 * Math.PI)]
            t4 = [(r + u - 0.25) / (maxR - 0.25), (theta + v) / (2 * Math.PI)]
            textureList.push(...t1, ...t2, ...t3, ...t2, ...t4, ...t3)
        }
    }

    return {
        vertices: vertexList,
        normal: normalList,
        texture: textureList,
        tangent: tangentList
    };
}


function CalculateNormal(r, theta, delta, tangent = false) {
    let currentPoint = equations(r, theta);
    let pointR = equations(r + delta, theta);
    let pointTheta = equations(r, theta + delta);

    let dg_dr = {
        x: (pointR.x - currentPoint.x) / delta,
        y: (pointR.y - currentPoint.y) / delta,
        z: (pointR.z - currentPoint.z) / delta
    };
    if (tangent) return dg_dr

    let dg_dtheta = {
        x: (pointTheta.x - currentPoint.x) / delta,
        y: (pointTheta.y - currentPoint.y) / delta,
        z: (pointTheta.z - currentPoint.z) / delta
    };

    let normal = cross(dg_dr, dg_dtheta);

    normalize(normal);

    return normal;
}

function equations(r, theta) {
    let x = -(Math.cos(theta) / (2 * r)) - (Math.pow(r, 3) * Math.cos(3 * theta) / 6);
    let y = -(Math.sin(theta) / (2 * r)) + (Math.pow(r, 3) * Math.sin(3 * theta) / 6);
    let z = r * Math.cos(theta);

    return { x: x, y: y, z: z }
}

function cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function normalize(a) {
    var b = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    a.x /= b;
    a.y /= b;
    a.z /= b;
}

// Function to update the surface with the new max value of parameter r
function updateSurface() {
    const maxR = parseFloat(document.getElementById("paramR").value);
    document.getElementById("currentMaxR").textContent = maxR.toFixed(2);
    const paramU = parseFloat(document.getElementById("paramU").value);
    document.getElementById("currentU").textContent = paramU.toFixed(2);
    const paramV = parseFloat(document.getElementById("paramV").value);
    document.getElementById("currentV").textContent = paramV.toFixed(2);
    let data = CreateSurfaceData(maxR, paramU, paramV);
    surface.BufferData(data.vertices, data.normal, data.tangent, data.texture);
    draw();
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTangent = gl.getAttribLocation(prog, "tangent");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelMatrixNormal = gl.getUniformLocation(prog, "ModelNormalMatrix");
    shProgram.iLightPosition = gl.getUniformLocation(prog, "lightPosition");
    shProgram.idiffuse = gl.getUniformLocation(prog, "diffuseT");
    shProgram.inormal = gl.getUniformLocation(prog, "normalT");
    shProgram.ispecular = gl.getUniformLocation(prog, "specularT");

    surface = new Model('Surface');
    let data = CreateSurfaceData(1);
    surface.BufferData(data.vertices, data.normal, data.tangent, data.texture);

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
    const diffuse = CreateTexute()
    const normal = CreateTexute()
    const specular = CreateTexute()
    LoadImage(diffuse, diffuseSrc)
    LoadImage(normal, normalSrc)
    LoadImage(specular, specularSrc)
    gl.activeTexture(gl.TEXTURE0); // Activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, diffuse); // Bind the diffuse texture
    gl.uniform1i(shProgram.idiffuse, 0); // Set the sampler to use texture unit 0

    // Bind and assign the normal texture (normTex) to texture unit 1
    gl.activeTexture(gl.TEXTURE1); // Activate texture unit 1
    gl.bindTexture(gl.TEXTURE_2D, normal); // Bind the normal texture
    gl.uniform1i(shProgram.inormal, 1); // Set the sampler to use texture unit 1

    // Bind and assign the specular texture (specTex) to texture unit 2
    gl.activeTexture(gl.TEXTURE2); // Activate texture unit 2
    gl.bindTexture(gl.TEXTURE_2D, specular); // Bind the specular texture
    gl.uniform1i(shProgram.ispecular, 2);
    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function CreateTexute() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
}
function LoadImage(texture, src) {
    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = src
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}
function SetTexture(texture, location, i) {
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the diffuse texture
    gl.uniform1i(location, i);
}